import React from "react";
import { Table, Tag, Typography, Radio, Space, Divider } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ICart } from "../../../pages/carts/cart.types";
import { EMAIL_TEMPLATES } from "../../../services/emailTemplates";

const { Text } = Typography;

interface RecipientTemplateStepProps {
  /** Carts that will be emailed (recipients). */
  recipients: ICart[];
  /** Currently selected EmailJS template id. */
  templateId: string;
  onTemplateChange: (templateId: string) => void;
  /** Optional extra column (e.g. the promo/discount for each recipient). */
  extraColumns?: ColumnsType<ICart>;
}

/** Recipients missing an email address can't be mailed. */
const hasEmail = (cart: ICart) => Boolean(cart.email?.trim());

/**
 * Shared step 2 for both the Send Promotion and Smart AI modals: shows the
 * recipient email list and a template picker below it. The template chosen here
 * is the EmailJS template each recipient's mail is sent with.
 */
const RecipientTemplateStep: React.FC<RecipientTemplateStepProps> = ({
  recipients,
  templateId,
  onTemplateChange,
  extraColumns = [],
}) => {
  const mailable = recipients.filter(hasEmail);

  const columns: ColumnsType<ICart> = [
    { title: "User Name", dataIndex: "userName", key: "userName" },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email: string) =>
        email?.trim() ? email : <Tag color="red">No email</Tag>,
    },
    { title: "Cart Number", dataIndex: "cartNumber", key: "cartNumber" },
    ...extraColumns,
  ];

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <div>
        <Text strong>
          Recipients ({mailable.length} of {recipients.length} with an email)
        </Text>
        <Table<ICart>
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={recipients}
          pagination={false}
          style={{ marginTop: 8 }}
        />
      </div>

      <div>
        <Divider titlePlacement="left" style={{ marginTop: 0 }}>
          Email Template
        </Divider>
        <Radio.Group
          value={templateId}
          onChange={(e) => onTemplateChange(e.target.value)}
        >
          <Space orientation="vertical">
            {EMAIL_TEMPLATES.map((template) => (
              <Radio key={template.id} value={template.id}>
                {template.name}{" "}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ({template.id})
                </Text>
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </div>
    </Space>
  );
};

export default RecipientTemplateStep;
