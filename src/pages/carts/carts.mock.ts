import { ICart } from "./cart.types";

/**
 * Dummy abandoned-cart data used while the backend integration is pending.
 * Each cart carries the shopper details shown in the list plus the line
 * items rendered on the Manage Cart screen.
 */
export const MOCK_CARTS: ICart[] = [
  {
    id: "1",
    cartNumber: "CART-100245",
    userName: "Olivia Bennett",
    userId: "USR-3391",
    email: "olivia.bennett@example.com",
    status: "abandoned",
    itemCount: 3,
    cartTotal: 184.97,
    currency: "USD",
    lastModifiedDate: "2026-06-28T14:32:00Z",
    items: [
      { id: "1-1", sku: "TSHIRT-BLK-M", name: "Classic Cotton T-Shirt", quantity: 2, unitPrice: 24.99 },
      { id: "1-2", sku: "JEAN-SLIM-32", name: "Slim Fit Jeans", quantity: 1, unitPrice: 79.99 },
      { id: "1-3", sku: "CAP-NVY-OS", name: "Embroidered Cap", quantity: 1, unitPrice: 54.99 },
    ],
  },
  {
    id: "2",
    cartNumber: "CART-100246",
    userName: "Marcus Lee",
    userId: "USR-2208",
    email: "marcus.lee@example.com",
    status: "reminded",
    itemCount: 1,
    cartTotal: 129.0,
    currency: "USD",
    lastModifiedDate: "2026-06-29T09:11:00Z",
    items: [
      { id: "2-1", sku: "SNEAK-WHT-10", name: "Running Sneakers", quantity: 1, unitPrice: 129.0 },
    ],
  },
  {
    id: "3",
    cartNumber: "CART-100247",
    userName: "Priya Nair",
    userId: "USR-4417",
    email: "priya.nair@example.com",
    status: "abandoned",
    itemCount: 5,
    cartTotal: 342.45,
    currency: "USD",
    lastModifiedDate: "2026-06-30T07:45:00Z",
    items: [
      { id: "3-1", sku: "DRESS-FLR-S", name: "Floral Summer Dress", quantity: 2, unitPrice: 89.99 },
      { id: "3-2", sku: "SANDAL-TAN-7", name: "Leather Sandals", quantity: 1, unitPrice: 64.49 },
      { id: "3-3", sku: "BAG-TOTE-OS", name: "Canvas Tote Bag", quantity: 1, unitPrice: 39.99 },
      { id: "3-4", sku: "SCARF-SLK-OS", name: "Silk Scarf", quantity: 1, unitPrice: 57.99 },
    ],
  },
  {
    id: "4",
    cartNumber: "CART-100248",
    userName: "Daniel Osei",
    userId: "USR-1175",
    email: "daniel.osei@example.com",
    status: "recovered",
    itemCount: 2,
    cartTotal: 98.5,
    currency: "USD",
    lastModifiedDate: "2026-06-27T18:20:00Z",
    items: [
      { id: "4-1", sku: "HOODIE-GRY-L", name: "Fleece Hoodie", quantity: 1, unitPrice: 58.5 },
      { id: "4-2", sku: "SOCK-3PK-OS", name: "Athletic Socks (3-pack)", quantity: 2, unitPrice: 20.0 },
    ],
  },
  {
    id: "5",
    cartNumber: "CART-100249",
    userName: "Sofia Romano",
    userId: "USR-5092",
    email: "sofia.romano@example.com",
    status: "abandoned",
    itemCount: 4,
    cartTotal: 271.96,
    currency: "USD",
    lastModifiedDate: "2026-06-30T05:02:00Z",
    items: [
      { id: "5-1", sku: "JACKET-DNM-M", name: "Denim Jacket", quantity: 1, unitPrice: 119.99 },
      { id: "5-2", sku: "TEE-WHT-S", name: "Basic Tee", quantity: 2, unitPrice: 19.99 },
      { id: "5-3", sku: "BELT-LTH-32", name: "Leather Belt", quantity: 1, unitPrice: 111.99 },
    ],
  },
];

export const getCartById = (id: string): ICart | undefined =>
  MOCK_CARTS.find((cart) => cart.id === id);
