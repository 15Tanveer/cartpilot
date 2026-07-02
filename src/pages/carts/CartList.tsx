import React, { useEffect, useMemo, useState } from "react";
import { Table, Tag, Input, Space, Button, Badge, App as AntdApp } from "antd";
import { EditOutlined, SearchOutlined, FilterOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import ActionCard from "../../components/common/Card/ActionCard";
import { ICart } from "./cart.types";
import { getCartListApi } from "../../api/cartsApi";
import { getUserDetailByStoreCode } from "../../api/userApi";
import {
  extractCartListItems,
  extractCartListTotal,
  formatCartDate,
  formatCurrency,
  STATUS_COLORS,
  STATUS_LABELS,
  mapApiCartToICart,
} from "./cart.utils";
import FilterDialog from "./FilterDialog";
import { IFilterCondition, applyCartFilters } from "./cart.filters";

const DEFAULT_PAGE_SIZE = 50;
const PAGE_SIZE_OPTIONS = ["50", "100", "200", "500"];

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
  // Id of the cart whose user detail is currently being fetched (per-row spinner).
  const [managingId, setManagingId] = useState<string | null>(null);

  const openCart = (cart: ICart) => {
    navigate(`/carts/edit/${cart.id}`);
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
        state: { userDetail: response.User },
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
      title: "User Name",
      dataIndex: "userName",
      key: "userName",
    },
    {
      title: "User ID",
      dataIndex: "userId",
      key: "userId",
    },
    {
      title: "Items",
      dataIndex: "itemCount",
      key: "itemCount",
      align: "center",
    },
    {
      title: "Cart Total",
      dataIndex: "cartTotal",
      key: "cartTotal",
      align: "right",
      render: (value: number, record) => formatCurrency(value, record.currency),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: ICart["status"]) => (
        <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
      ),
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
        <Button
          type="text"
          icon={<EditOutlined />}
          loading={managingId === record.id}
          onClick={(e) => {
            e.stopPropagation();
            openManage(record);
          }}
        >
          Manage
        </Button>
      ),
    },
  ];

  const filterSection = (
    <Space wrap>
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
        <Table<ICart>
          rowKey="id"
          columns={columns}
          dataSource={visibleCarts}
          loading={loading}
          onRow={(record) => ({
            onClick: () => openCart(record),
            style: { cursor: "pointer" },
          })}
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
      </Space>

      <FilterDialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={setFilters}
        initialFilters={filters}
      />
    </ActionCard>
  );
};

export default CartList;
