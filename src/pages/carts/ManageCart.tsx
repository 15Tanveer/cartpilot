/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import {
  Table,
  Tag,
  Descriptions,
  Space,
  Button,
  Dropdown,
  Empty,
  Image,
  Skeleton,
  App as AntdApp,
  Divider,
} from "antd";
import { MailOutlined, RobotOutlined } from "@ant-design/icons";
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
  STATUS_COLORS,
  STATUS_LABELS,
} from "./cart.utils";
import noImage from "../../assets/no-image.png";
import AskAiSuggestionModal from "../../components/common/AskAi/AskAiSuggestionModal";
import SendPromotionModal from "./SendPromotionModal";
import { ABANDONED_CART_TEMPLATE_ID } from "../../services/emailTemplates";

// ---- Loading skeletons that mirror the real page layout ----

const SUMMARY_SKELETON_LABELS = [
  "Cart Number",
  "User ID",
  "Email",
  // "Status",
  "Last Modified",
  "Items",
  "Cart Total",
];

/** Shimmer for the cart summary: the real bordered Descriptions grid with
 *  the actual labels, but shimmering values. */
const CartSummarySkeleton: React.FC = () => (
  <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="small">
    {SUMMARY_SKELETON_LABELS.map((label) => (
      <Descriptions.Item key={label} label={label}>
        <Skeleton.Input active size="small" style={{ width: 120, minWidth: 80 }} />
      </Descriptions.Item>
    ))}
  </Descriptions>
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
      } catch (error) {
        // console.error("Failed to load user details:", error);
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
    { title: "SKU", dataIndex: "sku", key: "sku" },
    { title: "Product", dataIndex: "name", key: "name" },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
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
      render: (_, record) =>
        formatCurrency(record.unitPrice * record.quantity, cart.currency),
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
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="small">
          <Descriptions.Item label="Cart Number">
            {cart.cartNumber}
          </Descriptions.Item>
          {/* <Descriptions.Item label="User Name">
            {cart.userName}
          </Descriptions.Item> */}
          <Descriptions.Item label="User ID">{cart.userId}</Descriptions.Item>
          <Descriptions.Item label="Email">{cart.email}</Descriptions.Item>
          {/* <Descriptions.Item label="Status">
            <Tag color={STATUS_COLORS[cart.status]}>
              {STATUS_LABELS[cart.status]}
            </Tag>
          </Descriptions.Item> */}
          <Descriptions.Item label="Last Modified">
            {formatCartDate(cart.lastModifiedDate)}
          </Descriptions.Item>
          <Descriptions.Item label="Items">{cart.itemCount}</Descriptions.Item>
          <Descriptions.Item label="Cart Total">
            {formatCurrency(cart.cartTotal, cart.currency)}
          </Descriptions.Item>
        </Descriptions>

        {/* {(userDetail || loadingUser) && (
          <div>
            <Divider titlePlacement="left">Customer Account</Divider>
            {loadingUser && !userDetail ? (
              <Spin />
            ) : userDetail ? (
              <Descriptions
                bordered
                column={{ xs: 1, sm: 2, md: 3 }}
                size="small"
              >
                <Descriptions.Item label="Account User ID">
                  {userDetail.UserId}
                </Descriptions.Item>
                <Descriptions.Item label="Name">
                  {[userDetail.FirstName, userDetail.LastName]
                    .filter(Boolean)
                    .join(" ") || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Login / Username">
                  {userDetail.UserName || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Account Email">
                  {userDetail.Email || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  {userDetail.PhoneNumber || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Account Status">
                  <Tag color={userDetail.IsActive ? "green" : "red"}>
                    {userDetail.IsActive ? "Active" : "Inactive"}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            ) : null}
          </div>
        )} */}

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
                    <strong>{formatCurrency(total, cart.currency)}</strong>
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
