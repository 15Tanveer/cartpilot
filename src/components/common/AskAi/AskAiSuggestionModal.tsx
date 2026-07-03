import React, { useEffect, useState } from "react";
import { Modal, List, Tag, Typography, Alert, Spin, App as AntdApp } from "antd";
import { RobotOutlined } from "@ant-design/icons";
import { ICart } from "../../../pages/carts/cart.types";
import { cartAgeInDays } from "../../../pages/carts/cart.utils";
import {
  getCartAiSuggestions,
  IAiCartSuggestion,
} from "../../../services/geminiService";

const { Text } = Typography;

interface AskAiSuggestionModalProps {
  open: boolean;
  /** One cart (details page) or many (list page, e.g. current selection/page). */
  carts: ICart[];
  onClose: () => void;
}

/** Cart, coupon and promotion suggestions from Gemini, scoped to just the
 *  cart total and cart age to keep each request small and cheap. */
const AskAiSuggestionModal: React.FC<AskAiSuggestionModalProps> = ({
  open,
  carts,
  onClose,
}) => {
  const { message } = AntdApp.useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<IAiCartSuggestion[]>([]);

  useEffect(() => {
    if (!open || carts.length === 0) return;
    let cancelled = false;

    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const input = carts.map((cart) => ({
          cartNumber: cart.cartNumber,
          cartTotal: cart.cartTotal,
          currency: cart.currency,
          cartAgeDays: cartAgeInDays(cart.lastModifiedDate),
        }));
        const result = await getCartAiSuggestions(input);
        if (!cancelled) setSuggestions(result);
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof Error ? err.message : "Failed to get AI suggestions.";
          setError(msg);
          message.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSuggestions();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, carts]);

  return (
    <Modal
      title={
        <span>
          <RobotOutlined style={{ marginRight: 8 }} />
          AI Coupon &amp; Promotion Suggestions
        </span>
      }
      open={open}
      onCancel={onClose}
      onOk={onClose}
      okText="Close"
      cancelButtonProps={{ style: { display: "none" } }}
      destroyOnHidden
    >
      {loading && (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <Spin tip="Asking Gemini..." />
        </div>
      )}

      {!loading && error && (
        <Alert type="error" showIcon message="Couldn't get suggestions" description={error} />
      )}

      {!loading && !error && (
        <List
          dataSource={suggestions}
          renderItem={(item) => (
            <List.Item key={item.cartNumber}>
              <List.Item.Meta
                title={
                  <span>
                    <Tag color="blue">{item.cartNumber}</Tag>
                    <Text strong>{item.action}</Text>
                  </span>
                }
                description={item.reason}
              />
            </List.Item>
          )}
        />
      )}

      <Text type="secondary" style={{ fontSize: 12 }}>
        AI-generated suggestion only — any coupon still goes through standard
        approval, caps and expiry rules before it is issued.
      </Text>
    </Modal>
  );
};

export default AskAiSuggestionModal;
