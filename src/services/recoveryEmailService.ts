import emailjs from "@emailjs/browser";
import environmentConfig from "../config/environment";
import { ICart } from "../pages/carts/cart.types";
import { formatCurrency } from "../pages/carts/cart.utils";

/**
 * Absolute origin of the app, e.g. "http://localhost:3000". Used to turn files
 * served from `public/` into fully-qualified URLs. NOTE: an email client can
 * only load images/links that are reachable on the public internet — `localhost`
 * works while testing on your machine but must be a real host in production.
 */
const PUBLIC_BASE =
  typeof window !== "undefined" ? window.location.origin : "";

/**
 * Store branding rendered in the abandoned-cart recovery email.
 * `logoUrl` points at `public/header-admin-logo.png`, served at the site root.
 */
const STORE = {
  name: environmentConfig.appName,
  logoUrl: "https://cdn.prod.website-files.com/69bbe852f53519cb6c8930fa/69bbe852f53519cb6c894506_znode.webp",
  supportEmail: "aniket.nagpure@amla.io",
  discountCode: "DISCOUNT10",
};

/** Fallback thumbnail when a line item has no image. */
const PLACEHOLDER_PRODUCT_IMAGE = "https://placehold.co/64x64?text=Item";

/** One row inside the EmailJS Mustache section {{#items}} ... {{/items}}. */
export interface IRecoveryEmailItem {
  product_image: string;
  product_name: string;
  quantity: string;
  variant: string;
  price: string;
}

/** Optional promotion attached to a send: its coupon code and percentage. */
export interface IRecoveryPromo {
  /** Coupon code the shopper enters at checkout, e.g. "SAVE10". */
  code?: string;
  /** Discount percentage for this cart's tier, e.g. 10. */
  percent?: number;
}

/**
 * Maps a cart onto the EmailJS template variables. Keys here must match the
 * `{{placeholders}}` configured in the EmailJS template exactly. An optional
 * promo overrides the static discount so the email carries the promotion code
 * and percentage matched for this cart's tier.
 */
export const buildRecoveryEmailParams = (
  cart: ICart,
  promo?: IRecoveryPromo,
) => {
  const items: IRecoveryEmailItem[] = cart.items.map((item) => ({
    product_image: item.image ?? PLACEHOLDER_PRODUCT_IMAGE,
    product_name: item.name,
    quantity: String(item.quantity),
    variant: item.variant ?? item.sku,
    price: formatCurrency(item.unitPrice * item.quantity, cart.currency),
  }));

  return {
    // Branding
    logo: STORE.logoUrl,
    store_name: STORE.name,

    // Customer
    customer_name: cart.userName,

    // Recipient — the EmailJS template's "To Email" field must be {{email}}
    // so the message is delivered to the shopper.
    email: cart.email,

    // Cart items — consumed by the Mustache section {{#items}} ... {{/items}}.
    items,

    // Cart summary
    cart_total: formatCurrency(cart.cartTotal, cart.currency),

    // Checkout / promo — routes the shopper to the checkout page for their user id.
    checkout_url: `${PUBLIC_BASE}/checkout/${encodeURIComponent(cart.userId)}`,
    // Promo code + percentage: use the matched promotion when supplied, else the
    // template's static fallback code.
    discount_code: promo?.code || STORE.discountCode,
    discount_percent: promo?.percent != null ? `${promo.percent}%` : "",

    // Footer
    support_email: STORE.supportEmail,
    year: String(new Date().getFullYear()),
  };
};

/**
 * Sends the abandoned-cart recovery email for the given cart via EmailJS using
 * the given template. `templateId` falls back to the configured default;
 * `promo` optionally injects a matched promotion's code + percentage.
 * Resolves with the EmailJS response, rejects if sending fails or config is missing.
 */
export const sendRecoveryEmail = (
  cart: ICart,
  templateId?: string,
  promo?: IRecoveryPromo,
) => {
  const { emailjsServiceId, emailjsTemplateId, emailjsPublicKey } =
    environmentConfig;
  const resolvedTemplateId = templateId || emailjsTemplateId;

  if (!emailjsServiceId || !resolvedTemplateId || !emailjsPublicKey) {
    return Promise.reject(
      new Error(
        "EmailJS is not configured. Set REACT_APP_EMAILJS_SERVICE_ID, " +
          "REACT_APP_EMAILJS_TEMPLATE_ID and REACT_APP_EMAILJS_PUBLIC_KEY in your .env file.",
      ),
    );
  }

  return emailjs.send(
    emailjsServiceId,
    resolvedTemplateId,
    buildRecoveryEmailParams(cart, promo),
    { publicKey: emailjsPublicKey },
  );
};
