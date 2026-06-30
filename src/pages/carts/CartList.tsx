import React, { useMemo, useState } from "react";
import { Table, Tag, Input, Space, Button } from "antd";
import { EditOutlined, SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import ActionCard from "../../components/common/Card/ActionCard";
import { ICart } from "./cart.types";
import { MOCK_CARTS } from "./carts.mock";
import {
  formatCartDate,
  formatCurrency,
  STATUS_COLORS,
  STATUS_LABELS,
} from "./cart.utils";

const CartList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const openCart = (cart: ICart) => {
    navigate(`/carts/edit/${cart.id}`);
  };

  const filteredCarts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return MOCK_CARTS;
    return MOCK_CARTS.filter(
      (cart) =>
        cart.cartNumber.toLowerCase().includes(term) ||
        cart.userName.toLowerCase().includes(term) ||
        cart.userId.toLowerCase().includes(term) ||
        cart.email.toLowerCase().includes(term),
    );
  }, [search]);

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
      sorter: (a, b) => a.cartNumber.localeCompare(b.cartNumber),
    },
    {
      title: "User Name",
      dataIndex: "userName",
      key: "userName",
      sorter: (a, b) => a.userName.localeCompare(b.userName),
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
      sorter: (a, b) => a.cartTotal - b.cartTotal,
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
      sorter: (a, b) =>
        new Date(a.lastModifiedDate).getTime() -
        new Date(b.lastModifiedDate).getTime(),
      defaultSortOrder: "descend",
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => openCart(record)}
        >
          Manage
        </Button>
      ),
    },
  ];

  const searchSection = (
    <Input
      allowClear
      placeholder="Search by cart, user, or email"
      prefix={<SearchOutlined />}
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      style={{ width: 280 }}
    />
  );

  return (
    <ActionCard
      hideBackBtn
      title="Abandoned Carts"
      customButtonSection={searchSection}
    >
      <Space orientation="vertical" style={{ width: "100%" }} size="large">
        <Table<ICart>
          rowKey="id"
          columns={columns}
          dataSource={filteredCarts}
          onRow={(record) => ({
            onClick: () => openCart(record),
            style: { cursor: "pointer" },
          })}
          pagination={{ pageSize: 10, showSizeChanger: false }}
        />
      </Space>
    </ActionCard>
  );
};

export default CartList;
