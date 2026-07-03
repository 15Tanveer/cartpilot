import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ICart, ICartItem } from "../pages/carts/cart.types";
import {
  formatCartDate,
  formatCurrency,
  STATUS_LABELS,
} from "../pages/carts/cart.utils";

/** Summary rows shared by both export formats (same fields the manage page shows). */
const buildSummaryRows = (cart: ICart): [string, string][] => [
  ["Cart Number", cart.cartNumber],
  ["User ID", cart.userId],
  ["Email", cart.email],
  ["Status", STATUS_LABELS[cart.status]],
  ["Last Modified", formatCartDate(cart.lastModifiedDate)],
  ["Items", String(cart.itemCount)],
  ["Cart Total", formatCurrency(cart.cartTotal, cart.currency)],
];

const ITEM_HEADERS = [
  "Image",
  "SKU",
  "Product",
  "Qty",
  "Unit Price",
  "Line Total",
];

/** Item rows with the image link in the first column (CSV keeps the link;
 *  the PDF blanks it and draws the actual thumbnail in that cell). */
const buildItemRows = (cart: ICart, items: ICartItem[]): string[][] =>
  items.map((item) => [
    item.image ?? "",
    item.sku,
    item.name,
    String(item.quantity),
    formatCurrency(item.unitPrice, cart.currency),
    formatCurrency(item.unitPrice * item.quantity, cart.currency),
  ]);

const itemsTotal = (items: ICartItem[]): number =>
  items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

const CDN_BASE = (process.env.REACT_APP_CDN_URL || "").replace(/\/$/, "");

/** Rewrites a CDN image URL onto the same-origin /cdn-images path (see
 *  src/setupProxy.js). The CDN sends no CORS headers, so loading it directly
 *  with crossOrigin="anonymous" fails; the proxied path is same-origin and
 *  needs no CORS at all. */
const toProxiedCdnUrl = (url: string): string | null =>
  CDN_BASE && url.startsWith(CDN_BASE + "/")
    ? `/cdn-images${url.slice(CDN_BASE.length)}`
    : null;

const tryLoadPngDataUrl = (url: string): Promise<string | null> =>
  new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 48;
        canvas.height = img.naturalHeight || 48;
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(null);
          return;
        }
        context.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        // Most commonly a SecurityError from a tainted canvas (cached
        // non-CORS response reused for this crossOrigin request).
        console.warn(`[cart-export] canvas read failed for ${url}`, err);
        resolve(null);
      }
    };
    img.onerror = (event) => {
      console.warn(`[cart-export] image failed to load: ${url}`, event);
      resolve(null);
    };
    // Cache-bust so this CORS-flagged request can't reuse a cached
    // response that was fetched without crossOrigin elsewhere on the page.
    img.src = url + (url.includes("?") ? "&" : "?") + "_pdfExport=1";
  });

/** Loads an image URL and re-encodes it as a PNG data URL that jsPDF can
 *  embed, preferring the same-origin proxied path for CDN images. Resolves
 *  null when the image cannot be loaded (bad URL, CORS, ...) so a broken
 *  thumbnail never blocks the export. */
const loadImageAsPngDataUrl = async (url: string): Promise<string | null> => {
  const proxied = toProxiedCdnUrl(url);
  if (proxied) {
    const viaProxy = await tryLoadPngDataUrl(proxied);
    if (viaProxy) return viaProxy;
  }
  return tryLoadPngDataUrl(url);
};

/** Quotes a CSV cell so commas, quotes and newlines inside values stay intact. */
const csvCell = (value: string): string => `"${value.replace(/"/g, '""')}"`;

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/** Downloads the cart summary + line items as a CSV file. */
export const exportCartToCsv = (cart: ICart, items: ICartItem[]) => {
  const lines: string[] = [];

  // Cart summary: one header row of field names, values in the row below.
  const summaryRows = buildSummaryRows(cart);
  lines.push(summaryRows.map(([label]) => csvCell(label)).join(","));
  lines.push(summaryRows.map(([, value]) => csvCell(value)).join(","));

  lines.push("");
  lines.push(csvCell("Cart Items"));
  lines.push(ITEM_HEADERS.map(csvCell).join(","));
  buildItemRows(cart, items).forEach((row) =>
    lines.push(row.map(csvCell).join(",")),
  );
  lines.push(
    ["", "", "", "", csvCell("Total"), csvCell(formatCurrency(itemsTotal(items), cart.currency))].join(","),
  );

  // Leading byte-order mark so Excel opens the file as UTF-8.
  const bom = String.fromCharCode(0xfeff);
  const blob = new Blob([bom + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  downloadBlob(blob, `cart-${cart.cartNumber}.csv`);
};

/** Downloads the cart summary + line items as a PDF file, with each item's
 *  thumbnail drawn in the Image column. */
export const exportCartToPdf = async (cart: ICart, items: ICartItem[]) => {
  // Preload all thumbnails up front; rows without a (loadable) image simply
  // get an empty Image cell.
  const thumbnails = await Promise.all(
    items.map((item) =>
      item.image ? loadImageAsPngDataUrl(item.image) : Promise.resolve(null),
    ),
  );

  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(`Cart Details - ${cart.cartNumber}`, 14, 18);

  autoTable(doc, {
    startY: 26,
    theme: "grid",
    head: [],
    body: buildSummaryRows(cart),
    styles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 } },
  });

  // v5 tracks the last drawn table on the doc but does not type it.
  const summaryEndY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 26;
  doc.setFontSize(13);
  doc.text("Cart Items", 14, summaryEndY + 12);

  const THUMB_SIZE = 12;
  autoTable(doc, {
    startY: summaryEndY + 16,
    head: [ITEM_HEADERS],
    // Blank the image link text; the thumbnail is drawn into the cell below.
    body: buildItemRows(cart, items).map(([, ...rest]) => ["", ...rest]),
    foot: [
      ["", "", "", "", "Total", formatCurrency(itemsTotal(items), cart.currency)],
    ],
    styles: { fontSize: 10, valign: "middle" },
    bodyStyles: { minCellHeight: THUMB_SIZE + 4 },
    headStyles: { fillColor: [24, 144, 255] },
    footStyles: { fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: THUMB_SIZE + 6, halign: "center" },
      3: { halign: "center" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
    didDrawCell: (data) => {
      if (data.section !== "body" || data.column.index !== 0) return;
      const thumbnail = thumbnails[data.row.index];
      if (!thumbnail) return;
      doc.addImage(
        thumbnail,
        "PNG",
        data.cell.x + (data.cell.width - THUMB_SIZE) / 2,
        data.cell.y + (data.cell.height - THUMB_SIZE) / 2,
        THUMB_SIZE,
        THUMB_SIZE,
      );
    },
  });

  doc.save(`cart-${cart.cartNumber}.pdf`);
};
