import React from "react";
import {
  Table,
  Tag,
  Space,
  Button,
  Empty,
  Image,
  Skeleton,
  Avatar,
  Typography,
  App as AntdApp,
  Divider,
} from "antd";
import {
  MailOutlined,
  RobotOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import ActionCard from "../../components/common/Card/ActionCard";
import { ICart, ICartItem } from "./cart.types";
import { IUserDetail, getUserDetailByStoreCode } from "../../api/userApi";
import { getCartItemsApi } from "../../api/cartsApi";
import { getCartById } from "./carts.mock";
import {
  buildCartFromItems,
  formatCartDate,
  formatCurrency,
  mapApiItemToICartItem,
} from "./cart.utils";
import { StatTile, StatTileSkeleton, avatarColor, cartAgeTone } from "./cartVisuals";
import noImage from "../../assets/no-image.png";
import AskAiSuggestionModal from "../../components/common/AskAi/AskAiSuggestionModal";
import SendPromotionModal from "./SendPromotionModal";
import { ABANDONED_CART_TEMPLATE_ID } from "../../services/emailTemplates";

const { Text } = Typography;

// ---- Loading skeletons that mirror the real page layout ----

/** Shimmer for the cart summary: the same tile row as the real header
 *  (customer card + stat tiles), shimmering while data loads. */
const CartSummarySkeleton: React.FC = () => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
    <StatTileSkeleton />
    <StatTileSkeleton />
    <StatTileSkeleton />
    <StatTileSkeleton />
  </div>
);

/** Shimmer for the action buttons row (widths roughly match the real buttons). */
const ActionButtonsSkeleton: React.FC = () => (
  <Space wrap>
    {[190, 100].map((width, index) => (
      <Skeleton.Button key={index} active style={{ width }} />
    ))}
  </Space>
);

interface ISkeletonRow {
  id: number;
}

const itemSkeletonColumns: ColumnsType<ISkeletonRow> = [
  {
    title: "Image",
    key: "image",
    width: 72,
    align: "center",
    render: () => <Skeleton.Avatar active shape="square" size={48} />,
  },
  {
    title: "SKU",
    key: "sku",
    render: () => (
      <Skeleton.Input active size="small" style={{ width: 110, minWidth: 80 }} />
    ),
  },
  {
    title: "Product",
    key: "name",
    render: () => (
      <Skeleton.Input active size="small" style={{ width: 200, minWidth: 120 }} />
    ),
  },
  {
    title: "Qty",
    key: "quantity",
    align: "center",
    render: () => (
      <Skeleton.Input active size="small" style={{ width: 40, minWidth: 40 }} />
    ),
  },
  {
    title: "Unit Price",
    key: "unitPrice",
    align: "right",
    render: () => (
      <Skeleton.Input active size="small" style={{ width: 70, minWidth: 60 }} />
    ),
  },
  {
    title: "Line Total",
    key: "lineTotal",
    align: "right",
    render: () => (
      <Skeleton.Input active size="small" style={{ width: 70, minWidth: 60 }} />
    ),
  },
];

/** Shimmer for the cart items table: the real Table shell (same columns and
 *  headers) filled with shimmering placeholder rows. */
const CartItemsTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <Table<ISkeletonRow>
    rowKey="id"
    columns={itemSkeletonColumns}
    dataSource={Array.from({ length: rows }, (_, index) => ({ id: index }))}
    pagination={false}
  />
);

/** Full-page shimmer shown while the cart itself is being resolved. */
const ManageCartSkeleton: React.FC = () => (
  <Space orientation="vertical" style={{ width: "100%" }} size="large">
    <CartSummarySkeleton />
    <div>
      <Divider titlePlacement="left">Actions</Divider>
      <ActionButtonsSkeleton />
    </div>
    <div>
      <Divider titlePlacement="left">Cart Items</Divider>
      <CartItemsTableSkeleton />
    </div>
  </Space>
);

const ManageCart: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { message } = AntdApp.useApp();
  const [sendModalOpen, setSendModalOpen] = React.useState(false);
  const [askAiOpen, setAskAiOpen] = React.useState(false);

  // userId source (see CartList.openManage): the ?userId query param lets a
  // direct navigation / refresh re-run the portal + user chain on its own.
  const userIdParam = searchParams.get("userId");

  // Populated by CartList when navigating here: the cart record it already
  // fetched, plus (from the "Manage" action) the chained portal + user detail.
  // On a direct navigation / refresh they are absent, so we rebuild the cart
  // from the item-list + user detail fetched via the ?userId query param.
  const navState = location.state as
    | { cart?: ICart; userDetail?: IUserDetail }
    | null;

  const [cart, setCart] = React.useState<ICart | undefined>(
    () => navState?.cart ?? (id ? getCartById(id) : undefined),
  );
  const [userDetail, setUserDetail] = React.useState<IUserDetail | null>(
    navState?.userDetail ?? null,
  );

  const [items, setItems] = React.useState<ICartItem[]>([]);
  // True once the item-list fetch has settled (or can never run, e.g. there is
  // no userId to resolve). The items table keeps showing the skeleton until
  // then, so the "No data" empty state never flashes while data is on its way.
  const [itemsResolved, setItemsResolved] = React.useState(false);

  const handleBack = () => navigate("/carts");

  // Fetch the customer account (portal -> user chain) when we arrived without
  // router state but have a userId to look up.
  const lookupUserId = userIdParam || cart?.userId || "";
  React.useEffect(() => {
    // Without a user the item fetch can never run; the render guard below treats
    // "no userId" as already-resolved, so nothing to do here in that case.
    if (userDetail || !lookupUserId) return;
    const loadUser = async () => {
      try {
        const response = await getUserDetailByStoreCode(lookupUserId);
        if (response.HasError || !response.User) {
          message.error("Failed to load user details. Please try again.");
          setItemsResolved(true);
          return;
        }
        setUserDetail(response.User);
      } catch {
        message.error("Failed to load user details. Please try again.");
        setItemsResolved(true);
      }
    };
    loadUser();
  }, [lookupUserId, userDetail, message]);

  // Fetch the cart line items by cart number (the URL id is the ClassNumber).
  React.useEffect(() => {
    if (!id || !userDetail) return;
    let cancelled = false;
    getCartItemsApi(id, userDetail || undefined)
      .then((response) => {
        if (cancelled) return;
        if (response?.HasError) {
          message.error(response.ErrorMessage || "Failed to load cart items.");
          return;
        }
        const mappedItems = (response?.ItemList || []).map(mapApiItemToICartItem);
        setItems(mappedItems);
        // Direct link / refresh without router state: rebuild the cart header
        // from what we have instead of refetching the whole carts list.
        setCart((prev) => prev ?? buildCartFromItems(id, mappedItems, userDetail));
      })
      .catch(() => {
        if (!cancelled) message.error("Failed to load cart items.");
      })
      .finally(() => {
        if (!cancelled) setItemsResolved(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id, message, userDetail]);

  
  // Whole-page shimmer until the cart and its line items have loaded; the
  // real content then appears in one go instead of section by section. When
  // there is no userId to look up, the fetch chain never runs, so treat that
  // as already-resolved instead of syncing state from an effect.
  const resolved = itemsResolved || !lookupUserId;
  if (!resolved) {
    return (
      <ActionCard
        title={cart ? `Manage Cart - ${cart.cartNumber}` : "Manage Cart"}
        backBtnHandler={handleBack}
        hideBackBtn={false}
        saveBtnHandler={handleBack}
        // saveBtnText="Close"
      >
        <ManageCartSkeleton />
      </ActionCard>
    );
  }

  if (!cart) {
    return (
      <ActionCard title="Manage Cart" backBtnHandler={handleBack} hideBackBtn={false} saveBtnHandler={handleBack} saveBtnText="Close">
        <Empty description="Cart not found" />
      </ActionCard>
    );
  }

  const customerName = cart.userName?.trim() || "";
  const ageTone = cartAgeTone(cart.lastModifiedDate);

  const itemColumns: ColumnsType<ICartItem> = [
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      width: 90,
      align: "center",
      render: (value?: string) =>
        value ? (
          <Image
            src={value}
            alt=""
            width={48}
            height={48}
            preview={false}
            style={{ objectFit: "contain" }}
          />
        ) : (
          <Image
            src={noImage}
            alt=""
            width={48}
            height={48}
            preview={false}
            style={{ objectFit: "contain" }}
          />
        ),
    },
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
      render: (value: string) => <Text type="secondary">{value || "—"}</Text>,
    },
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      render: (value: string) => (
        <span style={{ fontWeight: 600 }}>{value}</span>
      ),
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
      render: (value: number) => (
        <Space size={4}>
          <ShoppingCartOutlined style={{ color: "#8c8c8c" }} />
          <span>{value}</span>
        </Space>
      ),
    },
    {
      title: "Unit Price",
      dataIndex: "unitPrice",
      key: "unitPrice",
      align: "right",
      render: (value: number) => formatCurrency(value, cart.currency),
    },
    {
      title: "Line Total",
      key: "lineTotal",
      align: "right",
      render: (_, record) => (
        <Text strong style={{ color: "#36882f", fontSize: 14 }}>
          {formatCurrency(record.unitPrice * record.quantity, cart.currency)}
        </Text>
      ),
    },
  ];

  const featureButtons = (
    <Space wrap>
      <Button
        type="primary"
        icon={<MailOutlined />}
        onClick={() => setSendModalOpen(true)}
      >
        Send Mail
      </Button>
    </Space>
  );

  return (
    <ActionCard
      title={`Manage Cart - ${cart.cartNumber}`}
      backBtnHandler={handleBack}
      saveBtnHandler={handleBack}
      // saveBtnText="Close"
    >
      <Space orientation="vertical" style={{ width: "100%" }} size="large">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          <div
            style={{
              flex: "1.5 1 240px",
              minWidth: 220,
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "16px 18px",
              borderRadius: 10,
              background: "#ffffff",
              border: "1px solid #f0f0f0",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <Avatar
              size={44}
              style={{
                backgroundColor: customerName
                  ? avatarColor(customerName)
                  : "#bfbfbf",
                flexShrink: 0,
              }}
              icon={!customerName ? <UserOutlined /> : undefined}
            >
              {customerName ? customerName.charAt(0).toUpperCase() : undefined}
            </Avatar>
            <div style={{ lineHeight: 1.4, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>
                {customerName || "Guest User"}
              </div>
              <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                {cart.email?.trim() || "No email on file"}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ID {cart.userId || "—"}
              </Text>
            </div>
          </div>
          <StatTile
            label="Items in cart"
            hint="Items in cart"
            value={String(cart.itemCount)}
            icon={<ShoppingCartOutlined />}
            accent="#5db043"
            tint="#e0ffd1"
          />
          <StatTile
            label="Cart total"
            hint="Cart total"
            value={formatCurrency(cart.cartTotal, cart.currency)}
            icon={<DollarOutlined />}
            accent="#1890ff"
            tint="#e6f7ff"
          />
          <div
            style={{
              flex: "1 1 180px",
              minWidth: 160,
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "16px 18px",
              borderRadius: 10,
              background: "#ffffff",
              border: "1px solid #f0f0f0",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#fff7e6",
                color: "#fa8c16",
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              <ClockCircleOutlined />
            </div>
            <div style={{ lineHeight: 1.4, minWidth: 0 }}>
              <Tag
                color={ageTone.color}
                icon={<ClockCircleOutlined />}
                style={{ marginInlineEnd: 0 }}
              >
                {ageTone.label}
              </Tag>
              <Text
                type="secondary"
                style={{ fontSize: 12, display: "block", marginTop: 4 }}
              >
                Last modified {formatCartDate(cart.lastModifiedDate)}
              </Text>
            </div>
          </div>
        </div>

        <div>
          <Divider titlePlacement="left">Actions</Divider>
          {featureButtons}
        </div>

        <div>
          <Divider titlePlacement="left">Cart Items</Divider>
          <Table<ICartItem>
            rowKey="id"
            columns={itemColumns}
            dataSource={items.length ? items : cart.items}
            pagination={false}
            summary={(rows) => {
              const total = rows.reduce(
                (sum, row) => sum + row.unitPrice * row.quantity,
                0,
              );
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5} align="right">
                    <strong>Total</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    <Text strong style={{ color: "#36882f", fontSize: 14 }}>
                      {formatCurrency(total, cart.currency)}
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        </div>

        <Button icon={<RobotOutlined />} onClick={() => setAskAiOpen(true)}>
          Ask AI for coupon/promotion suggestions
        </Button>
      </Space>

      <AskAiSuggestionModal
        open={askAiOpen}
        carts={[cart]}
        onClose={() => setAskAiOpen(false)}
      />

      {/* Detail-page send: this single cart, restricted to the Abandoned Cart
          template (the list page uses the Welcome template instead). */}
      <SendPromotionModal
        open={sendModalOpen}
        recipients={[cart]}
        allowedTemplateIds={[ABANDONED_CART_TEMPLATE_ID]}
        onClose={() => setSendModalOpen(false)}
      />
    </ActionCard>
  );
};

export default ManageCart;
