import { ArrowLeftOutlined } from "@ant-design/icons";
import { Card, Space, Button } from "antd";
import React from "react";

interface IActionCard {
  title: string;
  backBtnText?: string;
  backBtnHandler?: () => void;
  saveBtnText?: string;
  saveBtnHandler?: () => void;
  children: React.ReactNode;
  hideBackBtn?: boolean;
  saveLoader?: boolean;
  customButtonSection?: React.ReactNode;
}

const ActionCard = (props: IActionCard) => {
  const {
    title,
    backBtnText,
    backBtnHandler,
    saveBtnText,
    saveBtnHandler,
    children,
    hideBackBtn,
    saveLoader,
    customButtonSection,
  } = props;
  return (
    <Card
      title={
        <Space>
          <div>{title}</div>
        </Space>
      }
      extra={
        customButtonSection ? (
          customButtonSection
        ) : (
          <Space>
            {hideBackBtn ? null : (
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={backBtnHandler}
              >
                {backBtnText || "Back"}
              </Button>
            )}
            <Button
              type="primary"
              onClick={saveBtnHandler}
              loading={saveLoader}
            >
              {saveBtnText || "Save & Close"}
            </Button>
          </Space>
        )
      }
    >
      {children}
    </Card>
  );
};

export default ActionCard;
