import React, { useMemo } from "react";
import { Layout, Menu, Drawer, Image } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import * as Icons from "@ant-design/icons";
import { MENU_ITEMS } from "../../constants";
import logo from "../../assets/logo-amla.svg";
import "./DynamicSidebar.scss";
import { IDynamicSidebarProps } from "../../interfaces/clientInterfaces/common";

const DynamicSidebar: React.FC<IDynamicSidebarProps> = ({
  collapsed = false,
  onCollapsedChange,
  isMobile = false,
  sidebarVisible = true,
  onSidebarClose,
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const getIcon = (iconName: string) => {
    const IconComp = Icons[
      iconName as keyof typeof Icons
    ] as React.ComponentType;
    return IconComp ? React.createElement(IconComp) : null;
  };

  const menuItems = useMemo(() => {
    return MENU_ITEMS.map((item) => ({
      key: item.key,
      icon: getIcon(item.icon),
      label: item.label,
      onClick: () => {
        navigate(item.path);
        if (isMobile && onSidebarClose) onSidebarClose();
      },
    }));
  }, [navigate, isMobile, onSidebarClose]);

  const selectedKey = useMemo(() => {
    const match = MENU_ITEMS.find((item) => pathname.startsWith(item.key));
    return match?.key || "";
  }, [pathname]);

  const sidebarContent = (
    <Layout.Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapsedChange}
      className="sider"
      breakpoint="lg"
      collapsedWidth={80}
      width={200}
      trigger={null}
    >
      {/* Logo */}
      <div className="logo">
        <h2 className="logoText">
          {!collapsed ? (
            <Image src={logo} width={60} height={40} preview={false} />
          ) : (
            <Image src={logo} width={30} height={20} preview={false} />
          )}
        </h2>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[selectedKey || ""]}
        items={menuItems}
        className={`menu ${collapsed ? "menuCollapsed" : ""}`}
      />
    </Layout.Sider>
  );

  if (isMobile) {
    return (
      <Drawer
        title={""}
        placement="left"
        onClose={onSidebarClose}
        open={sidebarVisible}
        bodyStyle={{ padding: 0 }}
        headerStyle={{ padding: "12px 16px" }}
        width="100%"
      >
        <div className="drawerContent">
          <Menu
            mode="inline"
            selectedKeys={[selectedKey || ""]}
            items={menuItems}
            className="menu"
            theme="light"
          />
        </div>
      </Drawer>
    );
  }

  return sidebarContent;
};

export default DynamicSidebar;
