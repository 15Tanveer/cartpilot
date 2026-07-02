import React from "react";
import { useParams } from "react-router-dom";
import {
  App as AntdApp,
  Button,
  Card,
  Divider,
  List,
  Result,
  Space,
  Tag,
  Typography,
} from "antd";
import { LockOutlined, TagOutlined } from "@ant-design/icons";
import { getCartByUserId } from "../carts/carts.mock";
import { formatCurrency } from "../carts/cart.utils";

const { Title, Text, Paragraph } = Typography;

/** Promo code surfaced in the recovery email and pre-applied here. */
const DISCOUNT_CODE = "DISCOUNT10";
const STORE_LOGO = `${window.location.origin}/header-admin-logo.svg`;

const pageStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  padding: 24,
  backgroundColor: "#f5f5f5",
};

/**
 * Dummy customer-facing checkout page. A shopper lands here from the
 * "Send Recovery Email" link, which routes to /checkout/:userId. The cart is
 * resolved from mock data by user id until the real backend is wired up.
 */
const Checkout: React.FC = () => {
  const { userId } = useParams();
  const { message } = AntdApp.useApp();

  const cart = userId ? getCartByUserId(userId) : undefined;

  if (!cart) {
    return (
      <div style={pageStyle}>
        <Card style={{ maxWidth: 480, width: "100%" }}>
          <Result
            status="404"
            title="Cart not found"
            subTitle={
              userId
                ? `We couldn't find an active cart for user "${userId}".`
                : "No user was provided."
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <Card style={{ maxWidth: 560, width: "100%" }}>
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          <Space
            orientation="vertical"
            size={4}
            align="center"
            style={{ width: "100%" }}
          >
            <img
              src={STORE_LOGO}
              alt="Store logo"
              style={{ height: 40, objectFit: "contain" }}
            />
            <Title level={4} style={{ margin: 0 }}>
              Complete your checkout
            </Title>
            <Text type="secondary">
              Welcome back, {cart.userName} — your cart is waiting.
            </Text>
          </Space>

          <Divider style={{ margin: "8px 0" }} />

          <List
            itemLayout="horizontal"
            dataSource={cart.items}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={item.name}
                  description={
                    <Text type="secondary">
                      {item.variant ?? item.sku} · Qty {item.quantity}
                    </Text>
                  }
                />
                <Text strong>
                  {formatCurrency(
                    item.unitPrice * item.quantity,
                    cart.currency,
                  )}
                </Text>
              </List.Item>
            )}
          />

          <Divider style={{ margin: "8px 0" }} />

          <Space style={{ justifyContent: "space-between", width: "100%" }}>
            <Space>
              <TagOutlined />
              <Text>
                Promo applied: <Tag color="green">{DISCOUNT_CODE}</Tag>
              </Text>
            </Space>
            <Space orientation="vertical" size={0} align="end">
              <Text type="secondary">Total</Text>
              <Title level={4} style={{ margin: 0 }}>
                {formatCurrency(cart.cartTotal, cart.currency)}
              </Title>
            </Space>
          </Space>

          <Button
            type="primary"
            size="large"
            icon={<LockOutlined />}
            block
            onClick={() =>
              message.success("This is a demo checkout — no payment was taken.")
            }
          >
            Pay {formatCurrency(cart.cartTotal, cart.currency)}
          </Button>

          <Paragraph
            type="secondary"
            style={{ textAlign: "center", margin: 0, fontSize: 12 }}
          >
            Secure dummy checkout · Cart {cart.cartNumber}
          </Paragraph>
        </Space>
      </Card>
    </div>
  );
};

export default Checkout;
