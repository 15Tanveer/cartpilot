export type CartStatus = "abandoned" | "recovered" | "reminded";

export interface ICartItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface ICart {
  id: string;
  cartNumber: string;
  userName: string;
  userId: string;
  email: string;
  status: CartStatus;
  itemCount: number;
  cartTotal: number;
  currency: string;
  lastModifiedDate: string; // ISO date string
  items: ICartItem[];
}

// Single record shape returned in CollectionDetails by
// GET /commerceapi/v1/carts/list.
export interface ICartListApiRecord {
  ClassNumber: string;
  CustomerName: string | null;
  CustomerEmailId: string | null;
  CustomerId: number;
  Quantity: number;
  Total: number;
  SubTotal: number;
  CurrencyCode: string;
  CurrencySuffix: string;
  ClassStatus: string;
  StatusCode: string;
  CreatedDate: string;
  ModifiedDate: string;
  OrderDate: string;
  StoreName: string;
  StoreCode: string;
}

export interface ICartListApiResponse {
  PaginationDetail: {
    PageIndex: number;
    PageSize: number;
    TotalPages: number;
    TotalResults: number;
  };
  CollectionDetails: ICartListApiRecord[];
}
