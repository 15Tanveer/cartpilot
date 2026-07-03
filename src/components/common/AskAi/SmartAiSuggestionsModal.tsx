import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  List,
  Table,
  Tag,
  Typography,
  Alert,
  Spin,
  Divider,
  Button,
  Space,
  Steps,
  App as AntdApp,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { TableRowSelection } from "antd/es/table/interface";
import { BulbOutlined, RobotOutlined, MailOutlined } from "@ant-design/icons";
import { ICart } from "../../../pages/carts/cart.types";
import { IPromotion } from "../../../pages/carts/promotion.types";
import { cartAgeInDays } from "../../../pages/carts/cart.utils";
import {
  getSmartBatchSuggestions,
  SMART_BATCH_CART_LIMIT,
  IAiBatchSuggestion,
} from "../../../services/geminiService";
import {
  getPromotionListApi,
  extractPromotionListItems,
  mapApiPromotionToIPromotion,
  findPromotionForPercent,
} from "../../../api/promotionApi";
import { sendRecoveryEmail } from "../../../services/recoveryEmailService";
import { WELCOME_TEMPLATE_ID } from "../../../services/emailTemplates";
import RecipientTemplateStep from "./RecipientTemplateStep";

// The Smart AI list-page flow only offers the Welcome template.
const AI_ALLOWED_TEMPLATE_IDS = [WELCOME_TEMPLATE_ID];

const { Text, Paragraph } = Typography;

interface SmartAiSuggestionsModalProps {
  open: boolean;
  /** All carts to study (Cart Total + Cart Age). */
  carts: ICart[];
  onClose: () => void;
}

const EMPTY: IAiBatchSuggestion = { insights: [], tiers: [] };

/** Bigger discounts stand out redder; smaller discounts (high-value carts) greener. */
const discountColor = (percent: number): string => {
  if (percent >= 25) return "red";
  if (percent >= 15) return "orange";
  return "green";
};

/** One selectable row: a cart with its AI-tiered discount and matched promo. */
interface IDiscountRow {
  cart: ICart;
  percent: number;
  promotion?: IPromotion;
  /** The AI's short reasoning for this cart's discount. */
  reason: string;
}

/**
 * "Smart AI Suggestions": studies Cart Total + Cart Age across all carts, then
 * (step 1) lists every cart with its AI-tiered discount % and matched promo code
 * in one table — ordered by discount, with a per-row checkbox and select-all;
 * (step 2) shows the recipients for the checked rows, a template picker, and
 * sends the emails.
 */
const SmartAiSuggestionsModal: React.FC<SmartAiSuggestionsModalProps> = ({
  open,
  carts,
  onClose,
}) => {
  const { message } = AntdApp.useApp();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IAiBatchSuggestion>(EMPTY);
  const [promotions, setPromotions] = useState<IPromotion[]>([]);

  // Cart ids checked in step 1 (one row per cart).
  const [selectedIds, setSelectedIds] = useState<React.Key[]>([]);
  const [templateId, setTemplateId] = useState(WELCOME_TEMPLATE_ID);
  const [sending, setSending] = useState(false);

  // Study the highest-value carts (the ones worth tiering), capped so the AI
  // response fits its budget. This is also what the count/table below reflect.
  const studied = useMemo(
    () =>
      [...carts]
        .sort((a, b) => b.cartTotal - a.cartTotal)
        .slice(0, SMART_BATCH_CART_LIMIT),
    [carts],
  );
  const trimmed = carts.length - studied.length;

  // Look up a cart by its number so tiers can be joined back to full records.
  const cartByNumber = useMemo(
    () => new Map(studied.map((c) => [c.cartNumber, c])),
    [studied],
  );

  // Fetch AI tiers + the promotion list together whenever the modal opens.
  useEffect(() => {
    if (!open || studied.length === 0) return;
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const input = studied.map((cart) => ({
          cartNumber: cart.cartNumber,
          cartTotal: cart.cartTotal,
          currency: cart.currency,
          cartAgeDays: cartAgeInDays(cart.lastModifiedDate),
        }));
        const [suggestion, promoResponse] = await Promise.all([
          getSmartBatchSuggestions(input),
          getPromotionListApi().catch(() => null),
        ]);
        if (cancelled) return;
        setResult(suggestion);
        setPromotions(
          promoResponse
            ? extractPromotionListItems(promoResponse).map(
                mapApiPromotionToIPromotion,
              )
            : [],
        );
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

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, studied]);

  // One row per cart: its AI-tiered discount % and the promotion matched to it.
  // Ordered by discount ascending so all 5% rows sit together, then 8%, etc.
  const rows = useMemo<IDiscountRow[]>(() => {
    const built: IDiscountRow[] = [];
    result.tiers.forEach((tier) => {
      const cart = cartByNumber.get(tier.cartNumber);
      if (!cart) return;
      built.push({
        cart,
        percent: tier.discountPercent,
        promotion: findPromotionForPercent(promotions, tier.discountPercent),
        reason: tier.reason || "",
      });
    });
    // Order by discount ascending so all 5% rows sit together, then 8%, etc.;
    // within a band, higher-value carts first.
    return built.sort(
      (a, b) => a.percent - b.percent || b.cart.cartTotal - a.cart.cartTotal,
    );
  }, [result.tiers, cartByNumber, promotions]);

  // Pre-select every row once the rows are known.
  useEffect(() => {
    setSelectedIds(rows.map((r) => r.cart.id));
  }, [rows]);

  // Reset back to step 1 each time the modal is reopened.
  useEffect(() => {
    if (open) {
      setStep(0);
      setTemplateId(WELCOME_TEMPLATE_ID);
    }
  }, [open]);

  // The checked rows, and the carts + per-cart promo derived from them.
  const selectedRows = rows.filter((r) => selectedIds.includes(r.cart.id));
  const recipients = selectedRows.map((r) => r.cart);
  const promoByCartNumber = useMemo(() => {
    const map = new Map<string, { code?: string; percent: number }>();
    selectedRows.forEach((r) =>
      map.set(r.cart.cartNumber, {
        code: r.promotion?.code,
        percent: r.percent,
      }),
    );
    return map;
  }, [selectedRows]);

  const goToRecipients = () => {
    if (recipients.length === 0) {
      message.warning("Select at least one cart to continue.");
      return;
    }
    setStep(1);
  };

  const mailable = recipients.filter((c) => c.email?.trim());

  const handleSend = async () => {
    if (mailable.length === 0) {
      message.warning("None of the selected carts have an email address.");
      return;
    }
    setSending(true);
    try {
      const results = await Promise.allSettled(
        mailable.map((cart) => {
          const promo = promoByCartNumber.get(cart.cartNumber);
          return sendRecoveryEmail(cart, templateId, {
            code: promo?.code,
            percent: promo?.percent,
          });
        }),
      );
      const sent = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - sent;
      if (sent > 0) {
        message.success(
          `Triggered ${sent} email${sent === 1 ? "" : "s"}${
            failed ? `, ${failed} failed` : ""
          }.`,
        );
      }
      if (failed > 0 && sent === 0) {
        message.error("Failed to send the emails. Please try again.");
      }
      if (sent > 0) onClose();
    } catch {
      message.error("Failed to send the emails. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // Step-1 table: one selectable row per cart, ordered by discount.
  const rowColumns: ColumnsType<IDiscountRow> = [
    {
      title: "Cart Number",
      key: "cartNumber",
      render: (_: unknown, row) => <Tag color="blue">{row.cart.cartNumber}</Tag>,
    },
    {
      title: "Username",
      key: "userName",
      render: (_: unknown, row) => row.cart.userName?.trim() || "Guest User",
    },
    {
      title: "Discount",
      key: "discount",
      render: (_: unknown, row) => (
        <Space size={4} wrap>
          <Tag color={discountColor(row.percent)}>{row.percent}% off</Tag>
          {row.promotion ? (
            <Tag>{row.promotion.code.toUpperCase()}</Tag>
          ) : (
            <Tag color="warning">No code</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Why",
      key: "reason",
      render: (_: unknown, row) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {row.reason || "—"}
        </Text>
      ),
    },
  ];

  const rowSelection: TableRowSelection<IDiscountRow> = {
    selectedRowKeys: selectedIds,
    onChange: (keys) => setSelectedIds(keys),
  };

  // Extra column on the step-2 recipient table: the promo/discount per recipient.
  const promoColumn: ColumnsType<ICart> = [
    {
      title: "Discount",
      key: "discount",
      align: "center",
      render: (_: unknown, record) => {
        const promo = promoByCartNumber.get(record.cartNumber);
        if (!promo) return "—";
        return (
          <Space size={4}>
            <Tag color={discountColor(promo.percent)}>{promo.percent}% off</Tag>
            {promo.code && <Tag>{promo.code.toUpperCase()}</Tag>}
          </Space>
        );
      },
    },
  ];

  const footer =
    step === 0 ? (
      <Space>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          type="primary"
          disabled={loading || !!error || recipients.length === 0}
          onClick={goToRecipients}
        >
          Next ({recipients.length} carts)
        </Button>
      </Space>
    ) : (
      <Space>
        <Button onClick={() => setStep(0)}>Back</Button>
        <Button
          type="primary"
          icon={<MailOutlined />}
          loading={sending}
          disabled={mailable.length === 0}
          onClick={handleSend}
        >
          Send Mail to {mailable.length} customer
          {mailable.length === 1 ? "" : "s"}
        </Button>
      </Space>
    );

  return (
    <Modal
      title={
        <span>
          <RobotOutlined style={{ marginRight: 8 }} />
          Smart AI Suggestions
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={footer}
      width={720}
      destroyOnHidden
      styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
    >
      <Steps
        current={step}
        size="small"
        style={{ marginBottom: 20 }}
        items={[{ title: "Select Carts" }, { title: "Recipients & Send" }]}
      />

      {loading && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin tip={`Studying ${studied.length} carts...`} />
        </div>
      )}

      {!loading && error && (
        <Alert
          type="error"
          showIcon
          message="Couldn't get suggestions"
          description={error}
        />
      )}

      {!loading && !error && step === 0 && (
        <>
          {trimmed > 0 && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message={`Analysing the ${studied.length} highest-value carts (${trimmed} more not shown).`}
            />
          )}
          <Divider titlePlacement="left" style={{ marginTop: 0 }}>
            <BulbOutlined /> Promotion Insights
          </Divider>
          <List
            size="small"
            dataSource={result.insights}
            locale={{ emptyText: "No batch insights returned." }}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />

          <Divider titlePlacement="left">Per-Cart Discounts</Divider>
          <Paragraph type="secondary" style={{ fontSize: 12 }}>
            Each cart gets an AI-tiered discount matched to a promotion code,
            ordered smallest discount first. Select the carts you want to email.
          </Paragraph>
          {/* Extra top padding on the first row of each new discount band gives
              the "minor vertical spacing" between 5% / 8% / ... groups. */}
          <style>{`
            .smart-ai-band-start > td { padding-top: 14px !important; }
          `}</style>
          <Table<IDiscountRow>
            rowKey={(row) => row.cart.id}
            size="small"
            rowSelection={rowSelection}
            columns={rowColumns}
            dataSource={rows}
            pagination={false}
            locale={{ emptyText: "No discounts returned." }}
            rowClassName={(row, index) => {
              const prev = rows[index - 1];
              return prev && prev.percent !== row.percent
                ? "smart-ai-band-start"
                : "";
            }}
          />
        </>
      )}

      {!loading && !error && step === 1 && (
        <RecipientTemplateStep
          recipients={recipients}
          templateId={templateId}
          onTemplateChange={setTemplateId}
          extraColumns={promoColumn}
          allowedTemplateIds={AI_ALLOWED_TEMPLATE_IDS}
        />
      )}

      <Divider style={{ margin: "16px 0 8px" }} />
      <Text type="secondary" style={{ fontSize: 12 }}>
        AI-generated suggestions only — any coupon still goes through standard
        approval, caps and expiry rules before it is issued.
      </Text>
    </Modal>
  );
};

export default SmartAiSuggestionsModal;
