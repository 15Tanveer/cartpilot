import React from "react";
import { Layout, Button } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import { useResponsive } from "../../hooks";
import "./Header.scss";
import { APP_NAME } from "../../constants";

interface HeaderProps {
  onMenuClick?: () => void;
  onThemeToggle?: () => void;
  theme?: "light" | "dark";
  collapsed?: boolean;
  onCollapseToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  collapsed: _collapsed,
  onCollapseToggle: _onCollapseToggle,
}) => {
  const { isMobile } = useResponsive();

  return (
    <Layout.Header className="header">
      <div className="headerContent">
        <div className="leftSection">
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={onMenuClick}
              className="menuButton"
              size="small"
            />
          )}

          <span className="title">{APP_NAME}</span>
        </div>
      </div>
    </Layout.Header>
  );
};

export default Header;
