import React from "react";
import {
  Table,
  Tag,
  Descriptions,
  Space,
  Button,
  Empty,
  App as AntdApp,
  Divider,
} from "antd";
import {
  MailOutlined,
  TagOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  ExportOutlined,
  BellOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate, useParams } from "react-router-dom";
import ActionCard from "../../components/common/Card/ActionCard";
import { ICartItem } from "./cart.types";
import { getCartById } from "./carts.mock";
import {
  formatCartDate,
  formatCurrency,
  STATUS_COLORS,
  STATUS_LABELS,
} from "./cart.utils";

const ManageCart: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();

  const cart = id ? getCartById(id) : undefined;

  const handleBack = () => navigate("/carts");

  if (!cart) {
    return (
      <ActionCard title="Manage Cart" backBtnHandler={handleBack} hideBackBtn={false} saveBtnHandler={handleBack} saveBtnText="Close">
        <Empty description="Cart not found" />
      </ActionCard>
    );
  }

  const itemColumns: ColumnsType<ICartItem> = [
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
        onClick={() => message.success(`Recovery email sent to ${cart.email}`)}
      >
        Send Recovery Email
      </Button>
      <Button
        icon={<BellOutlined />}
        onClick={() => message.success("Reminder scheduled")}
      >
        Schedule Reminder
      </Button>
      <Button
        icon={<TagOutlined />}
        onClick={() => message.info("Discount code DISCOUNT10 applied to cart")}
      >
        Apply Discount
      </Button>
      <Button
        icon={<CheckCircleOutlined />}
        onClick={() => message.success("Cart marked as recovered")}
      >
        Mark Recovered
      </Button>
      <Button
        icon={<ExportOutlined />}
        onClick={() => message.info("Cart exported")}
      >
        Export
      </Button>
      <Button
        danger
        icon={<DeleteOutlined />}
        onClick={() => {
          message.success("Cart deleted");
          handleBack();
        }}
      >
        Delete Cart
      </Button>
    </Space>
  );

  return (
    <ActionCard
      title={`Manage Cart - ${cart.cartNumber}`}
      backBtnHandler={handleBack}
      saveBtnHandler={handleBack}
      saveBtnText="Close"
    >
      <Space orientation="vertical" style={{ width: "100%" }} size="large">
        <Descriptions
          bordered
          column={{ xs: 1, sm: 2, md: 3 }}
          size="small"
        >
          <Descriptions.Item label="Cart Number">
            {cart.cartNumber}
          </Descriptions.Item>
          <Descriptions.Item label="User Name">
            {cart.userName}
          </Descriptions.Item>
          <Descriptions.Item label="User ID">{cart.userId}</Descriptions.Item>
          <Descriptions.Item label="Email">{cart.email}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={STATUS_COLORS[cart.status]}>
              {STATUS_LABELS[cart.status]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Last Modified">
            {formatCartDate(cart.lastModifiedDate)}
          </Descriptions.Item>
          <Descriptions.Item label="Items">{cart.itemCount}</Descriptions.Item>
          <Descriptions.Item label="Cart Total">
            {formatCurrency(cart.cartTotal, cart.currency)}
          </Descriptions.Item>
        </Descriptions>

        <div>
          <Divider titlePlacement="left">Actions</Divider>
          {featureButtons}
        </div>

        <div>
          <Divider titlePlacement="left">Cart Items</Divider>
          <Table<ICartItem>
            rowKey="id"
            columns={itemColumns}
            dataSource={cart.items}
            pagination={false}
            summary={(rows) => {
              const total = rows.reduce(
                (sum, row) => sum + row.unitPrice * row.quantity,
                0,
              );
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4} align="right">
                    <strong>Total</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <strong>{formatCurrency(total, cart.currency)}</strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        </div>
      </Space>
    </ActionCard>
  );
};

export default ManageCart;
