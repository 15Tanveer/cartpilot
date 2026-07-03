import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Input,
  Space,
  Button,
  Badge,
  Skeleton,
  Tag,
  Avatar,
  Tooltip,
  Typography,
  App as AntdApp,
} from "antd";
import {
  EditOutlined,
  SearchOutlined,
  FilterOutlined,
  MailOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { TableRowSelection } from "antd/es/table/interface";
import { useNavigate } from "react-router-dom";
import ActionCard from "../../components/common/Card/ActionCard";
import { ICart } from "./cart.types";
import { getCartListApi } from "../../api/cartsApi";
import { getUserDetailByStoreCode } from "../../api/userApi";
import {
  cartAgeInDays,
  extractCartListItems,
  extractCartListTotal,
  formatCartAge,
  formatCartDate,
  formatCurrency,
  mapApiCartToICart,
  STATUS_COLORS,
  STATUS_LABELS,
} from "./cart.utils";
import FilterDialog from "./FilterDialog";
import SendPromotionModal from "./SendPromotionModal";
import { IFilterCondition, applyCartFilters } from "./cart.filters";
import AskAiSuggestionModal from "../../components/common/AskAi/AskAiSuggestionModal";
import SmartAiSuggestionsModal from "../../components/common/AskAi/SmartAiSuggestionsModal";
import SmartAiFloatButton from "../../components/common/AskAi/SmartAiFloatButton";

const { Text } = Typography;

const DEFAULT_PAGE_SIZE = 100;
const PAGE_SIZE_OPTIONS = ["50", "100", "200", "500"];

// A cart is "stale" (needs attention) once it has been idle beyond this.
const STALE_CART_DAYS = 3;

/** Colour + label for the Cart Age pill: fresher carts are greener, staler
 *  carts trend to red so rows that need attention stand out at a glance. */
const cartAgeTone = (isoDate: string): { color: string; label: string } => {
  const days = cartAgeInDays(isoDate);
  const label = formatCartAge(isoDate);
  if (Number.isNaN(days)) return { color: "default", label };
  if (days === 0) return { color: "green", label };
  if (days < STALE_CART_DAYS) return { color: "gold", label };
  return { color: "red", label };
};

/** Deterministic accent color for a user avatar, seeded by their name so the
 *  same user always gets the same tile color. */
const AVATAR_COLORS = [
  "#5db043",
  "#36882f",
  "#1890ff",
  "#722ed1",
  "#eb2f96",
  "#fa8c16",
  "#13c2c2",
];
const avatarColor = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// ---- Loading skeleton that mirrors the real table layout ----

interface ISkeletonRow {
  id: number;
}

const cartSkeletonColumns: ColumnsType<ISkeletonRow> = [
  {
    title: "Cart Number",
    key: "cartNumber",
    render: () => (
      <Skeleton.Input active size="small" style={{ width: 110, minWidth: 80 }} />
    ),
  },
  {
    title: "User Name",
    key: "userName",
    render: () => (
      <Skeleton.Input active size="small" style={{ width: 140, minWidth: 100 }} />
    ),
  },
  {
    title: "User ID",
    key: "userId",
    render: () => (
      <Skeleton.Input active size="small" style={{ width: 100, minWidth: 80 }} />
    ),
  },
  {
    title: "Items",
    key: "itemCount",
    align: "center",
    render: () => (
      <Skeleton.Input active size="small" style={{ width: 40, minWidth: 40 }} />
    ),
  },
  {
    title: "Cart Total",
    key: "cartTotal",
    align: "right",
    render: () => (
      <Skeleton.Input active size="small" style={{ width: 80, minWidth: 60 }} />
    ),
  },
  {
    title: "Cart Age",
    key: "cartAge",
    align: "center",
    render: () => (
      <Skeleton.Input active size="small" style={{ width: 60, minWidth: 50 }} />
    ),
  },
  {
    title: "Last Modified",
    key: "lastModifiedDate",
    render: () => (
      <Skeleton.Input active size="small" style={{ width: 140, minWidth: 100 }} />
    ),
  },
  {
    title: "Action",
    key: "action",
    align: "center",
    render: () => <Skeleton.Button active size="small" style={{ width: 100 }} />,
  },
];

// ---- At-a-glance stat tiles shown above the table ----

interface IStatTile {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
  tint: string;
  hint?: string;
}

const StatTile: React.FC<IStatTile> = ({
  label,
  value,
  icon,
  accent,
  tint,
  hint,
}) => (
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
        background: tint,
        color: accent,
        fontSize: 20,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ lineHeight: 1.3, minWidth: 0 }}>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#262626",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {hint || label}
      </Text>
    </div>
  </div>
);

const StatTileSkeleton: React.FC = () => (
  <div
    style={{
      flex: "1 1 180px",
      minWidth: 160,
      padding: "16px 18px",
      borderRadius: 10,
      background: "#ffffff",
      border: "1px solid #f0f0f0",
    }}
  >
    <Skeleton active title={false} paragraph={{ rows: 2, width: ["60%", "80%"] }} />
  </div>
);

/** Shimmer for the cart list: the real Table shell (same columns and headers,
 *  plus a disabled selection column) filled with shimmering placeholder rows. */
const CartListTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 8 }) => (
  <Table<ISkeletonRow>
    rowKey="id"
    rowSelection={{
      selectedRowKeys: [],
      getCheckboxProps: () => ({ disabled: true }),
    }}
    columns={cartSkeletonColumns}
    dataSource={Array.from({ length: rows }, (_, index) => ({ id: index }))}
    pagination={false}
  />
);

const CartList: React.FC = () => {
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const [carts, setCarts] = useState<ICart[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  // Client-side refinement applied only to the carts already fetched for the
  // current page (the API does not support server-side filter/search).
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<IFilterCondition[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedCarts, setSelectedCarts] = useState<ICart[]>([]);
  const [promotionOpen, setPromotionOpen] = useState(false);
  const [askAiOpen, setAskAiOpen] = useState(false);
  const [smartAiOpen, setSmartAiOpen] = useState(false);
  // Id of the cart whose user detail is currently being fetched (per-row spinner).
  const [managingId, setManagingId] = useState<string | null>(null);

  const openCart = (cart: ICart) => {
    // Hand the already-fetched cart over in router state so the manage page
    // does not need to refetch the carts list to find it; the userId in the
    // URL lets a refresh / direct link resolve the user + items on its own.
    const query = cart.userId
      ? `?userId=${encodeURIComponent(cart.userId)}`
      : "";
    navigate(`/carts/edit/${cart.id}${query}`, { state: { cart } });
  };

  // "Manage" action: resolve the portalId from the configured store code, fetch
  // the user's detail, then open the manage page with that detail in tow.
  const openManage = async (cart: ICart) => {
    if (!cart.userId) {
      openCart(cart);
      return;
    }
    setManagingId(cart.id);
    try {
      const response = await getUserDetailByStoreCode(cart.userId);
      // Carry the userId in the URL so a refresh / direct link on the manage
      // page can re-run the portal + user chain itself; the router state keeps
      // this navigation fast by handing over the already-fetched detail.
      navigate(`/carts/edit/${cart.id}?userId=${encodeURIComponent(cart.userId)}`, {
        state: { cart, userDetail: response.User },
      });
    } catch {
      message.error("Failed to load user details. Please try again.");
    } finally {
      setManagingId(null);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    const fetchCarts = async () => {
      setLoading(true);
      try {
        const response = await getCartListApi({ pageIndex, pageSize });
        if (isCancelled) return;
        const mappedCarts = extractCartListItems(response).map(mapApiCartToICart);
        setCarts(mappedCarts);
        setTotal(extractCartListTotal(response, mappedCarts.length));
      } catch {
        if (!isCancelled) {
          message.error("Failed to load carts. Please try again.");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchCarts();

    return () => {
      isCancelled = true;
    };
  }, [pageIndex, pageSize, message]);

  // At-a-glance metrics over the carts fetched for the current page. The list
  // API has no aggregate endpoint, so these summarize what is on screen.
  const insights = useMemo(() => {
    const currency = carts[0]?.currency || "USD";
    const totalValue = carts.reduce((sum, cart) => sum + cart.cartTotal, 0);
    const staleCount = carts.filter(
      (cart) => cartAgeInDays(cart.lastModifiedDate) >= STALE_CART_DAYS,
    ).length;
    return {
      count: carts.length,
      totalValue,
      avgValue: carts.length ? totalValue / carts.length : 0,
      staleCount,
      currency,
    };
  }, [carts]);

  // Search + dialog filters run over the current page's carts only.
  const visibleCarts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const searched = term
      ? carts.filter(
          (cart) =>
            cart.cartNumber.toLowerCase().includes(term) ||
            cart.userName.toLowerCase().includes(term) ||
            cart.userId.toLowerCase().includes(term) ||
            cart.email.toLowerCase().includes(term),
        )
      : carts;
    return applyCartFilters(searched, filters);
  }, [carts, search, filters]);

  // A cart can only be mailed if we know who to send to — it needs a user name,
  // a user id and an email address.
  const isCartSelectable = (cart: ICart) =>
    Boolean(cart.userName?.trim()) &&
    Boolean(cart.userId?.trim()) &&
    Boolean(cart.email?.trim());

  // Track the selected cart objects (not just keys) so the promotion modal has
  // the full records — emails/names — even for rows not on the current page.
  const rowSelection: TableRowSelection<ICart> = {
    selectedRowKeys,
    onChange: (keys, rows) => {
      setSelectedRowKeys(keys);
      setSelectedCarts(rows);
    },
    getCheckboxProps: (cart) => ({
      disabled: !isCartSelectable(cart),
      name: cart.cartNumber,
    }),
  };

  const clearSelection = () => {
    setSelectedRowKeys([]);
    setSelectedCarts([]);
  };

  const columns: ColumnsType<ICart> = [
    {
      title: "Cart Number",
      dataIndex: "cartNumber",
      key: "cartNumber",
      render: (value: string, record) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => openCart(record)}>
          {value}
        </Button>
      ),
    },
    {
      title: "Customer",
      dataIndex: "userName",
      key: "userName",
      render: (value: string, record) => {
        const name = value?.trim() || "Guest User";
        return (
          <Space size={10}>
            <Avatar
              size={34}
              style={{
                backgroundColor: value?.trim()
                  ? avatarColor(name)
                  : "#bfbfbf",
                flexShrink: 0,
              }}
              icon={!value?.trim() ? <UserOutlined /> : undefined}
            >
              {value?.trim() ? name.charAt(0).toUpperCase() : undefined}
            </Avatar>
            <div style={{ lineHeight: 1.3, minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{name}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.email?.trim() || `ID ${record.userId || "—"}`}
              </Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: "User ID",
      dataIndex: "userId",
      key: "userId",
      render: (value: string) => (
        <Text type="secondary">{value || "—"}</Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status: ICart["status"]) => (
        <Tag color={STATUS_COLORS[status]} style={{ marginInlineEnd: 0 }}>
          {STATUS_LABELS[status]}
        </Tag>
      ),
    },
    {
      title: "Items",
      dataIndex: "itemCount",
      key: "itemCount",
      align: "center",
      render: (value: number) => (
        <Space size={4}>
          <ShoppingCartOutlined style={{ color: "#8c8c8c" }} />
          <span>{value}</span>
        </Space>
      ),
    },
    {
      title: "Cart Total",
      dataIndex: "cartTotal",
      key: "cartTotal",
      align: "right",
      sorter: (a, b) => a.cartTotal - b.cartTotal,
      render: (value: number, record) => (
        <Text strong style={{ color: "#36882f", fontSize: 14 }}>
          {formatCurrency(value, record.currency)}
        </Text>
      ),
    },
    {
      title: "Cart Age",
      dataIndex: "lastModifiedDate",
      key: "cartAge",
      align: "center",
      sorter: (a, b) =>
        new Date(a.lastModifiedDate).getTime() -
        new Date(b.lastModifiedDate).getTime(),
      render: (value: string) => {
        const { color, label } = cartAgeTone(value);
        return (
          <Tag
            color={color}
            icon={<ClockCircleOutlined />}
            style={{ marginInlineEnd: 0 }}
          >
            {label}
          </Tag>
        );
      },
    },
    {
      title: "Last Modified",
      dataIndex: "lastModifiedDate",
      key: "lastModifiedDate",
      render: (value: string) => formatCartDate(value),
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Tooltip title="Open and manage this cart">
          <Button
            type="link"
            icon={<EditOutlined />}
            loading={managingId === record.id}
            onClick={(e) => {
              e.stopPropagation();
              openManage(record);
            }}
          >
            Manage
          </Button>
        </Tooltip>
      ),
    },
  ];

  const filterSection = (
    <Space wrap>
      {selectedRowKeys.length > 0 && (
        <Button
          type="primary"
          icon={<MailOutlined />}
          onClick={() => setPromotionOpen(true)}
        >
          Send Mail ({selectedRowKeys.length})
        </Button>
      )}
      <Input
        allowClear
        placeholder="Search this page"
        prefix={<SearchOutlined />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: 220 }}
      />
      <Badge count={filters.length} size="small">
        <Button icon={<FilterOutlined />} onClick={() => setFilterOpen(true)}>
          Filter
        </Button>
      </Badge>
    </Space>
  );

  return (
    <ActionCard
      hideBackBtn
      title="Abandoned Carts"
      customButtonSection={filterSection}
    >
      <Space orientation="vertical" style={{ width: "100%" }} size="large">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          {loading ? (
            <>
              <StatTileSkeleton />
              <StatTileSkeleton />
              <StatTileSkeleton />
              <StatTileSkeleton />
            </>
          ) : (
            <>
              <StatTile
                label="Carts on this page"
                hint="Carts on this page"
                value={String(insights.count)}
                icon={<ShoppingCartOutlined />}
                accent="#5db043"
                tint="#e0ffd1"
              />
              <StatTile
                label="Recoverable value"
                hint="Recoverable value"
                value={formatCurrency(insights.totalValue, insights.currency)}
                icon={<DollarOutlined />}
                accent="#1890ff"
                tint="#e6f7ff"
              />
              <StatTile
                label="Average cart value"
                hint="Average cart value"
                value={formatCurrency(insights.avgValue, insights.currency)}
                icon={<RiseOutlined />}
                accent="#722ed1"
                tint="#f9f0ff"
              />
              <StatTile
                label="Needs attention"
                hint={`Idle ${STALE_CART_DAYS}+ days`}
                value={String(insights.staleCount)}
                icon={<ClockCircleOutlined />}
                accent="#fa8c16"
                tint="#fff7e6"
              />
            </>
          )}
        </div>

        {loading ? (
          <CartListTableSkeleton />
        ) : (
          <Table<ICart>
            rowKey="id"
            rowSelection={rowSelection}
            columns={columns}
            dataSource={visibleCarts}
            pagination={{
              current: pageIndex,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: PAGE_SIZE_OPTIONS,
              showTotal: (t) => `${t} carts`,
              onChange: (page, size) => {
                setPageIndex(page);
                setPageSize(size);
              },
            }}
          />
        )}

        {!loading && visibleCarts.length > 0 && (
          <Button icon={<RobotOutlined />} onClick={() => setAskAiOpen(true)}>
            Ask AI for coupon/promotion suggestions
            {selectedRowKeys.length > 0 ? ` (${selectedRowKeys.length} selected)` : ""}
          </Button>
        )}
      </Space>

      <FilterDialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={setFilters}
        initialFilters={filters}
      />

      <SendPromotionModal
        open={promotionOpen}
        recipients={selectedCarts}
        onClose={() => setPromotionOpen(false)}
        onSent={clearSelection}
      />

      <AskAiSuggestionModal
        open={askAiOpen}
        // Use the selected carts if any are checked, otherwise cap to a small
        // batch from the current page so the AI request stays cheap.
        carts={selectedCarts.length > 0 ? selectedCarts : visibleCarts.slice(0, 10)}
        onClose={() => setAskAiOpen(false)}
      />

      {/* Floating action: studies Cart Total + Cart Age across all loaded carts
          and proposes batch promotions + inverse-tiered per-cart discounts. */}
      <SmartAiFloatButton
        visible={!loading && visibleCarts.length > 0}
        onClick={() => setSmartAiOpen(true)}
      />

      <SmartAiSuggestionsModal
        open={smartAiOpen}
        carts={visibleCarts}
        onClose={() => setSmartAiOpen(false)}
      />
    </ActionCard>
  );
};

export default CartList;
