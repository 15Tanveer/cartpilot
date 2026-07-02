export type CartStatus = "abandoned" | "recovered" | "reminded";

export interface ICartItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  /** Product thumbnail URL used in the recovery email ({{this.product_image}}). */
  image?: string;
  /** Variant info such as size/color used in the recovery email ({{this.variant}}). */
  variant?: string;
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

// Product attribute entry inside an item's Attributes array; the entry with
// AttributeCode "ProductImage" carries the thumbnail URL in AttributeValue.
export interface ICartItemAttribute {
  AttributeCode: string | null;
  AttributeValue: string | null;
  AttributeName: string | null;
}

// Child entry inside ChildItemList (note the SKU casing differs from the
// parent record's Sku).
export interface ICartChildItemApiRecord {
  ItemId: string;
  SKU: string | null;
  ProductName: string | null;
  Quantity: number;
  UnitPrice: number;
  Attributes?: ICartItemAttribute[] | null;
  ChildItemList?: ICartChildItemApiRecord[] | null;
}

// Single line item returned in ItemList by
// GET /commerceapi/v1/Carts/item-list/{cartNumber}.
// For configurable/bundled products the parent record's UnitPrice is 0 and
// the real prices are carried by the entries in ChildItemList.
export interface ICartItemApiRecord {
  ItemId: string;
  Sku: string | null;
  ProductName: string | null;
  Quantity: number;
  UnitPrice: number;
  Attributes?: ICartItemAttribute[] | null;
  ChildItemList?: ICartChildItemApiRecord[] | null;
}

export interface ICartItemListApiResponse {
  ClassNumber?: string;
  ItemList?: ICartItemApiRecord[];
  HasError?: boolean;
  ErrorMessage?: string | null;
}
