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
