import React, { useState } from "react";
import {
  Modal,
  Steps,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Space,
  Table,
  Typography,
  Tag,
  App as AntdApp,
} from "antd";
import { MailOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { ICart } from "./cart.types";

const { Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

/** Discount types supported by a promotion. */
export type DiscountType = "percent_off_order";

export const DISCOUNT_TYPE_OPTIONS: { label: string; value: DiscountType }[] = [
  { label: "Percent off order", value: "percent_off_order" },
];

/** Values captured by the "Create Promotion" form (step 1). */
export interface IPromotionForm {
  code: string;
  /** [start, end] from the AntD RangePicker (dayjs values). */
  dateRange: [unknown, unknown];
  discountType: DiscountType;
  /** Percent off the order total (0–100). */
  discountValue: number;
}

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

/** A dayjs value from AntD's RangePicker exposes a format() method. */
type DateLike = { format: (template: string) => string } | null | undefined;

/** Renders the [start, end] range as "MMM D, YYYY – MMM D, YYYY". */
const formatDateRange = (range: IPromotionForm["dateRange"]): string => {
  const [start, end] = (range ?? []) as [DateLike, DateLike];
  if (!start || !end) return "";
  return `${start.format("MMM D, YYYY")} – ${end.format("MMM D, YYYY")}`;
};

const SendPromotionModal: React.FC<SendPromotionModalProps> = ({
  open,
  recipients,
  onClose,
  onSent,
}) => {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm<IPromotionForm>();
  const [current, setCurrent] = useState(0);
  const [promotion, setPromotion] = useState<IPromotionForm | null>(null);
  const [sending, setSending] = useState(false);

  const mailable = recipients.filter(hasEmail);

  const resetAndClose = () => {
    form.resetFields();
    setPromotion(null);
    setCurrent(0);
    setSending(false);
    onClose();
  };

  const goToReview = async () => {
    try {
      const values = await form.validateFields();
      setPromotion(values);
      setCurrent(1);
    } catch {
      // validateFields rejects on invalid input; AntD shows the field errors.
    }
  };

  // Skip the promotion form and send a plain email (no promotion attached).
  const skipToReview = () => {
    setPromotion(null);
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
          ? `Promotion "${promotion.code.toUpperCase()}" sent to ${recipientLabel}.`
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

  const promotionForm = (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ discountType: "percent_off_order" }}
    >
      <Form.Item
        label="Promotion Code"
        name="code"
        rules={[{ required: true, message: "Enter a promotion code" }]}
      >
        <Input
          placeholder="e.g. SUMMER20"
          style={{ textTransform: "uppercase" }}
        />
      </Form.Item>

      <Form.Item
        label="Start & End Date"
        name="dateRange"
        rules={[{ required: true, message: "Select a start and end date" }]}
      >
        <RangePicker style={{ width: "100%" }} />
      </Form.Item>

      <Space size="middle" style={{ display: "flex" }} align="start">
        <Form.Item
          label="Discount Type"
          name="discountType"
          rules={[{ required: true, message: "Select a discount type" }]}
          style={{ flex: 1 }}
        >
          <Select options={DISCOUNT_TYPE_OPTIONS} />
        </Form.Item>

        <Form.Item
          label="Percent Off"
          name="discountValue"
          rules={[{ required: true, message: "Enter a percentage" }]}
        >
          <InputNumber
            min={1}
            max={100}
            placeholder="20"
            addonAfter="%"
            style={{ width: 140 }}
          />
        </Form.Item>
      </Space>
    </Form>
  );

  const reviewStep = (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      {promotion ? (
        <Paragraph style={{ marginBottom: 0 }}>
          Code <Tag>{promotion.code?.toUpperCase()}</Tag> —{" "}
          <Text strong>{promotion.discountValue}% off order</Text>
          {formatDateRange(promotion.dateRange) && (
            <Text type="secondary"> ({formatDateRange(promotion.dateRange)})</Text>
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
      width={720}
      destroyOnHidden
    >
      <Steps
        current={current}
        style={{ marginBottom: 24 }}
        items={[
          { title: "Create Promotion" },
          { title: "Review & Send" },
        ]}
      />
      {current === 0 ? promotionForm : reviewStep}
    </Modal>
  );
};

export default SendPromotionModal;
