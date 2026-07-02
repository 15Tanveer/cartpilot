import React, { useEffect, useState } from "react";
import {
  Modal,
  Steps,
  Button,
  Space,
  Table,
  Typography,
  Tag,
  App as AntdApp,
} from "antd";
import { MailOutlined, PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { TableRowSelection } from "antd/es/table/interface";
import { ICart } from "./cart.types";
import { IPromotion } from "./promotion.types";
import {
  getPromotionListApi,
  extractPromotionListItems,
  mapApiPromotionToIPromotion,
} from "../../api/promotionApi";
import environmentConfig from "../../config/environment";

/** Admin console URL for creating/managing promotions. */
const ADMIN_PROMOTION_URL = environmentConfig.adminUrl
  ? `${environmentConfig.adminUrl.replace(/\/$/, "")}/Promotion/List`
  : "";

const { Text, Paragraph } = Typography;

interface SendPromotionModalProps {
  open: boolean;
  /** Carts selected in the list — recipients of the promotion email. */
  recipients: ICart[];
  onClose: () => void;
  /** Called after a successful (simulated) send so the parent can reset selection. */
  onSent?: () => void;
}

/** Recipients missing an email address can't be mailed and are flagged in step 2. */
const hasEmail = (cart: ICart) => Boolean(cart.email?.trim());

/** Formats an ISO date as "MMM D, YYYY", or "" when absent/invalid. */
const formatPromoDate = (iso: string): string => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/** Renders a promotion's discount, e.g. "10% off" for percent-off promotions. */
const formatDiscount = (promo: IPromotion): string => {
  if (!promo.discountValue) return "—";
  const value = Number.isInteger(promo.discountValue)
    ? promo.discountValue
    : Number(promo.discountValue.toFixed(2));
  return /percent/i.test(promo.discountType)
    ? `${value}% off`
    : String(value);
};

const SendPromotionModal: React.FC<SendPromotionModalProps> = ({
  open,
  recipients,
  onClose,
  onSent,
}) => {
  const { message } = AntdApp.useApp();
  const [current, setCurrent] = useState(0);
  const [sending, setSending] = useState(false);

  // Promotion list (step 1) — fetched from GET /Promotion/List.
  const [promotions, setPromotions] = useState<IPromotion[]>([]);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(
    null,
  );

  const promotion =
    promotions.find((p) => p.id === selectedPromotionId) ?? null;

  const mailable = recipients.filter(hasEmail);

  // Load promotions whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const loadPromotions = async () => {
      setLoadingPromotions(true);
      try {
        const response = await getPromotionListApi();
        if (cancelled) return;
        const mapped = extractPromotionListItems(response).map(
          mapApiPromotionToIPromotion,
        );
        setPromotions(mapped);
      } catch {
        if (!cancelled) message.error("Failed to load promotions.");
      } finally {
        if (!cancelled) setLoadingPromotions(false);
      }
    };

    loadPromotions();
    return () => {
      cancelled = true;
    };
  }, [open, message]);

  const resetAndClose = () => {
    setSelectedPromotionId(null);
    setCurrent(0);
    setSending(false);
    onClose();
  };

  const goToReview = () => {
    if (!selectedPromotionId) {
      message.warning("Select a promotion to continue.");
      return;
    }
    setCurrent(1);
  };

  // Skip the promotion list and send a plain email (no promotion attached).
  const skipToReview = () => {
    setSelectedPromotionId(null);
    setCurrent(1);
  };

  const handleSend = async () => {
    if (mailable.length === 0) {
      message.warning("None of the selected carts have an email address.");
      return;
    }
    setSending(true);
    try {
      // Simulated send. Swap this block for a real per-recipient EmailJS send
      // (see services/recoveryEmailService.ts) when the promotion template exists.
      await new Promise((resolve) => setTimeout(resolve, 600));
      const recipientLabel = `${mailable.length} customer${
        mailable.length === 1 ? "" : "s"
      }`;
      message.success(
        promotion
          ? `Promotion "${
              promotion.code?.toUpperCase() || promotion.name
            }" sent to ${recipientLabel}.`
          : `Email sent to ${recipientLabel}.`,
      );
      onSent?.();
      resetAndClose();
    } catch {
      message.error("Failed to send the promotion email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const recipientColumns: ColumnsType<ICart> = [
    { title: "User Name", dataIndex: "userName", key: "userName" },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email: string) =>
        email?.trim() ? (
          email
        ) : (
          <Tag color="red">No email</Tag>
        ),
    },
    { title: "Cart Number", dataIndex: "cartNumber", key: "cartNumber" },
  ];

  const promotionColumns: ColumnsType<IPromotion> = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      render: (code: string) => <Tag>{code?.toUpperCase() || "—"}</Tag>,
    },
    { title: "Name", dataIndex: "name", key: "name" },
    {
      title: "Discount",
      key: "discount",
      align: "right",
      render: (_, record) => formatDiscount(record),
    },
    {
      title: "Type",
      dataIndex: "discountType",
      key: "discountType",
      render: (value: string) => value || "—",
    },
    {
      title: "Validity",
      key: "validity",
      render: (_, record) => {
        const start = formatPromoDate(record.startDate);
        const end = formatPromoDate(record.endDate);
        if (!start && !end) return "—";
        return `${start || "—"} – ${end || "—"}`;
      },
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      align: "center",
      render: (active: boolean) =>
        active ? (
          <Tag color="green">Active</Tag>
        ) : (
          <Tag color="default">Inactive</Tag>
        ),
    },
  ];

  // Single-select: the customer receives one promotion.
  const promotionRowSelection: TableRowSelection<IPromotion> = {
    type: "radio",
    selectedRowKeys: selectedPromotionId ? [selectedPromotionId] : [],
    onChange: (keys) => setSelectedPromotionId((keys[0] as string) ?? null),
  };

  const promotionList = (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Text type="secondary">
          Select a promotion to include in the email, or skip to send a plain
          email.
        </Text>
        {ADMIN_PROMOTION_URL && (
          <Button
            icon={<PlusOutlined />}
            href={ADMIN_PROMOTION_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Create Promotion
          </Button>
        )}
      </div>
      <Table<IPromotion>
        rowKey="id"
        size="small"
        loading={loadingPromotions}
        rowSelection={promotionRowSelection}
        columns={promotionColumns}
        dataSource={promotions}
        pagination={false}
        scroll={{ y: 300 }}
        onRow={(record) => ({
          onClick: () => setSelectedPromotionId(record.id),
          style: { cursor: "pointer" },
        })}
      />
    </Space>
  );

  const reviewStep = (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      {promotion ? (
        <Paragraph style={{ marginBottom: 0 }}>
          Code <Tag>{promotion.code?.toUpperCase() || "—"}</Tag> —{" "}
          <Text strong>{formatDiscount(promotion)}</Text>
          {promotion.discountType && (
            <Text type="secondary"> ({promotion.discountType})</Text>
          )}
          {formatPromoDate(promotion.startDate) && (
            <Text type="secondary">
              {" "}
              · valid {formatPromoDate(promotion.startDate)} –{" "}
              {formatPromoDate(promotion.endDate) || "—"}
            </Text>
          )}
        </Paragraph>
      ) : (
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Sending a direct email with no promotion attached.
        </Paragraph>
      )}

      <div>
        <Text strong>
          Recipients ({mailable.length} of {recipients.length} with an email)
        </Text>
        <Table<ICart>
          rowKey="id"
          size="small"
          columns={recipientColumns}
          dataSource={recipients}
          pagination={false}
          scroll={{ y: 260 }}
          style={{ marginTop: 8 }}
        />
      </div>
    </Space>
  );

  const footer =
    current === 0 ? (
      <Space>
        <Button onClick={resetAndClose}>Cancel</Button>
        <Button onClick={skipToReview}>Skip &amp; Send Directly</Button>
        <Button type="primary" onClick={goToReview}>
          Next
        </Button>
      </Space>
    ) : (
      <Space>
        <Button onClick={() => setCurrent(0)}>Back</Button>
        <Button
          type="primary"
          icon={<MailOutlined />}
          loading={sending}
          disabled={mailable.length === 0}
          onClick={handleSend}
        >
          Send to {mailable.length} customer{mailable.length === 1 ? "" : "s"}
        </Button>
      </Space>
    );

  return (
    <Modal
      title="Send Promotion Email"
      open={open}
      onCancel={resetAndClose}
      footer={footer}
      width={860}
      destroyOnHidden
    >
      <Steps
        current={current}
        style={{ marginBottom: 24 }}
        items={[
          { title: "Select Promotion" },
          { title: "Review & Send" },
        ]}
      />
      {current === 0 ? promotionList : reviewStep}
    </Modal>
  );
};

export default SendPromotionModal;
