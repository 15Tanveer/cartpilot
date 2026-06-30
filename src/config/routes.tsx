import { lazy } from "react";
import { ROUTES } from "../constants";
import { IAppRoute } from "../interfaces/clientInterfaces/common";

// Lazy load all page components
const CartList = lazy(() => import("../pages/carts/CartList"));
const ManageCart = lazy(() => import("../pages/carts/ManageCart"));
const NotFound = lazy(
  () => import("../components/common/NotFoundComponent/NotFound"),
);
const Login = lazy(() => import("../pages/login/Login"));

export const appRoutes: IAppRoute[] = [
  {
    path: ROUTES.LOGIN,
    component: Login,
    exact: true,
    protected: false,
  },
  {
    path: ROUTES.NOT_FOUND,
    component: NotFound,
    protected: true,
  },

  //Carts
  {
    path: ROUTES.CARTS,
    component: CartList,
    exact: true,
    protected: true,
  },
  {
    path: ROUTES.EDIT_CART,
    component: ManageCart,
    exact: true,
    protected: true,
    isEdit: true,
  },
];
