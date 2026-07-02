import React from "react";
import {
  Table,
  Tag,
  Descriptions,
  Space,
  Button,
  Empty,
  Spin,
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
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import ActionCard from "../../components/common/Card/ActionCard";
import { ICart, ICartItem } from "./cart.types";
import { IUserDetail, getUserDetailByStoreCode } from "../../api/userApi";
import { getCartByNumberApi, getCartItemsApi } from "../../api/cartsApi";
import { getCartById } from "./carts.mock";
import {
  formatCartDate,
  formatCurrency,
  mapApiCartToICart,
  mapApiItemToICartItem,
  STATUS_COLORS,
  STATUS_LABELS,
} from "./cart.utils";
import { sendRecoveryEmail } from "../../services/recoveryEmailService";

const ManageCart: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { message } = AntdApp.useApp();
  const [sendingEmail, setSendingEmail] = React.useState(false);

  // userId source (see CartList.openManage): the ?userId query param lets a
  // direct navigation / refresh re-run the portal + user chain on its own.
  const userIdParam = searchParams.get("userId");

  const [cart, setCart] = React.useState<ICart | undefined>(() =>
    id ? getCartById(id) : undefined,
  );
  const [loadingCart, setLoadingCart] = React.useState(false);

  // Populated by the "Manage" action in CartList after chaining the portal +
  // user-detail gateway calls. On a direct navigation / refresh it is absent,
  // so we fetch it below from the ?userId query param instead.
  const stateUserDetail = (location.state as { userDetail?: IUserDetail } | null)
    ?.userDetail;
  const [userDetail, setUserDetail] = React.useState<IUserDetail | null>(
    stateUserDetail ?? null,
  );
  const [ , setLoadingUser] = React.useState(false);

  const [items, setItems] = React.useState<ICartItem[]>([]);
  const [loadingItems, setLoadingItems] = React.useState(false);

  const handleBack = () => navigate("/carts");

  // Resolve the cart when it is not in the local mock (real ClassNumber opened
  // directly, e.g. /carts/edit/C-01072026-0056). Fetches the list and matches.
  React.useEffect(() => {
    if (!id || cart) return;
    let cancelled = false;
    setLoadingCart(true);
    getCartByNumberApi(id)
      .then((record) => {
        if (cancelled || !record) return;
        setCart(mapApiCartToICart(record));
      })
      .catch(() => {
        if (!cancelled) message.error("Failed to load cart. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoadingCart(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, cart, message]);

  // Fetch the customer account (portal -> user chain) when we arrived without
  // router state but have a userId to look up.
  const lookupUserId = userIdParam || cart?.userId || "";
  React.useEffect(() => {
    if (userDetail || !lookupUserId) return;
    const loadUser = async () => {
      setLoadingUser(true);
      try {
        const response = await getUserDetailByStoreCode(lookupUserId);
        if (response.HasError || !response.User) {
          message.error("Failed to load user details. Please try again.");
          return;
        }
        setUserDetail(response.User);
      } catch (error) {
        console.error("Failed to load user details:", error);
        message.error("Failed to load user details. Please try again.");
      } finally {
        setLoadingUser(false);
      }
    };
    loadUser();
  }, [lookupUserId, userDetail, message]);

  // Fetch the cart line items by cart number (the URL id is the ClassNumber).
  React.useEffect(() => {
    if (!id || !userDetail) return;
    let cancelled = false;
    setLoadingItems(true);
    getCartItemsApi(id, userDetail || undefined)
      .then((response) => {
        if (cancelled) return;
        if (response?.HasError) {
          message.error(response.ErrorMessage || "Failed to load cart items.");
          return;
        }
        // const data = JSON.parse(response?.ItemList || "[]") as ICartItem[];
        setItems((response?.ItemList || []).map(mapApiItemToICartItem));
      })
      .catch(() => {
        if (!cancelled) message.error("Failed to load cart items.");
      })
      .finally(() => {
        if (!cancelled) setLoadingItems(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, message,userDetail]);



  if (!cart) {
    return (
      <ActionCard title="Manage Cart" backBtnHandler={handleBack} hideBackBtn={false} saveBtnHandler={handleBack} saveBtnText="Close">
        {loadingCart ? (
          <Spin />
        ) : (
          <Empty description="Cart not found" />
        )}
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

  const handleSendRecoveryEmail = async () => {
    setSendingEmail(true);
    try {
      await sendRecoveryEmail(cart);
      message.success(`Recovery email sent to ${cart.email}`);
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : "Failed to send recovery email",
      );
    } finally {
      setSendingEmail(false);
    }
  };

  const featureButtons = (
    <Space wrap>
      <Button
        type="primary"
        icon={<MailOutlined />}
        loading={sendingEmail}
        onClick={handleSendRecoveryEmail}
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
          {/* <Descriptions.Item label="User Name">
            {cart.userName}
          </Descriptions.Item> */}
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

        {/* {(userDetail || loadingUser) && (
          <div>
            <Divider titlePlacement="left">Customer Account</Divider>
            {loadingUser && !userDetail ? (
              <Spin />
            ) : userDetail ? (
            <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="small">
              <Descriptions.Item label="Account User ID">
                {userDetail.UserId}
              </Descriptions.Item>
              <Descriptions.Item label="Name">
                {[userDetail.FirstName, userDetail.LastName]
                  .filter(Boolean)
                  .join(" ") || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Login / Username">
                {userDetail.UserName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Account Email">
                {userDetail.Email || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {userDetail.PhoneNumber || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Account Status">
                <Tag color={userDetail.IsActive ? "green" : "red"}>
                  {userDetail.IsActive ? "Active" : "Inactive"}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            ) : null}
          </div>
        )} */}

        <div>
          <Divider titlePlacement="left">Actions</Divider>
          {featureButtons}
        </div>

        <div>
          <Divider titlePlacement="left">Cart Items</Divider>
          <Table<ICartItem>
            rowKey="id"
            columns={itemColumns}
            dataSource={items.length ? items : cart.items}
            loading={loadingItems}
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
