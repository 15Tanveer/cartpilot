import {
  GoogleGenerativeAI,
  SchemaType,
  Schema,
  GenerationConfig,
  FinishReason,
} from "@google/generative-ai";
import environmentConfig from "../config/environment";

/** One cart's worth of input the AI suggestion is based on. */
export interface ICartAiInput {
  cartNumber: string;
  cartTotal: number;
  currency: string;
  cartAgeDays: number;
}

export interface IAiCartSuggestion {
  cartNumber: string;
  action: string;
  reason: string;
}

const MODEL_NAME = "gemini-flash-latest";
// Keep the response short: a couple of sentences per cart is plenty and keeps
// token (and therefore cost/latency) usage low.
const MAX_OUTPUT_TOKENS = 400;

let client: GoogleGenerativeAI | null = null;

const getClient = (): GoogleGenerativeAI => {
  if (!environmentConfig.geminiApiKey) {
    throw new Error(
      "Gemini API key is not configured. Set REACT_APP_GEMINI_API_KEY in your environment.",
    );
  }
  if (!client) {
    client = new GoogleGenerativeAI(environmentConfig.geminiApiKey);
  }
  return client;
};

/** Builds a compact, low-token prompt: only cart total + cart age per cart. */
const buildPrompt = (carts: ICartAiInput[]): string => {
  const rows = carts
    .map(
      (cart) =>
        `${cart.cartNumber} | total=${cart.currency} ${cart.cartTotal.toFixed(2)} | age=${cart.cartAgeDays}d`,
    )
    .join("\n");

  return `You are a retail promotion assistant for an abandoned-cart recovery tool.
For each cart below (cart number | cart total | cart age in days), recommend ONE short
coupon/promotion action. Prefer no discount for young/low-value carts; use a small
percent-off (max 15%) only for older/higher-value carts; use free shipping for
borderline carts. Be concise.

Carts:
${rows}

Reply with ONLY plain text, one line per cart, in this exact format and nothing else:
<cart_number> :: <action, e.g. "No discount - send reminder" | "10% off, 48h expiry" | "Free shipping offer"> :: <reason, max 12 words>`;
};

/** Parses the model's pipe-delimited text response back into structured rows. */
const parseResponse = (
  text: string,
  carts: ICartAiInput[],
): IAiCartSuggestion[] => {
  const byCartNumber = new Map<string, IAiCartSuggestion>();

  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const parts = line.split("::").map((part) => part.trim());
      if (parts.length < 2) return;
      const [cartNumber, action, reason = ""] = parts;
      if (!cartNumber) return;
      byCartNumber.set(cartNumber, { cartNumber, action, reason });
    });

  // Fall back to a raw line per cart if parsing didn't yield a match, so the
  // UI always has something to show instead of silently dropping a cart.
  return carts.map(
    (cart) =>
      byCartNumber.get(cart.cartNumber) || {
        cartNumber: cart.cartNumber,
        action: "See details",
        reason: text.trim() || "No suggestion returned.",
      },
  );
};

/**
 * Requests coupon/promotion suggestions for one or more carts from Gemini.
 * Only cart total + cart age are sent (no line items/PII) to keep the prompt
 * small and cheap.
 */
export const getCartAiSuggestions = async (
  carts: ICartAiInput[],
): Promise<IAiCartSuggestion[]> => {
  if (carts.length === 0) return [];

  const model = getClient().getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.4,
    },
  });

  const result = await model.generateContent(buildPrompt(carts));
  const text = result.response.text();
  return parseResponse(text, carts);
};

// ---------------------------------------------------------------------------
// Smart batch analysis: study Cart Total + Cart Age across ALL carts and return
// batch-level promotion ideas plus an inverse-tiered per-cart discount (a bigger
// cart gets a SMALLER percentage, so the same rate is not handed to everyone).
// ---------------------------------------------------------------------------

/** A per-cart discount recommendation from the batch study. */
export interface IAiCartTier {
  cartNumber: string;
  cartTotal: number;
  discountPercent: number;
  reason: string;
}

/** Result of studying the whole batch of carts. */
export interface IAiBatchSuggestion {
  /** Batch-level promotion ideas (e.g. free-shipping threshold, tiered campaign). */
  insights: string[];
  /** One inverse-tiered discount recommendation per cart. */
  tiers: IAiCartTier[];
}

// A response schema forces valid JSON, but the model still needs enough output
// budget to emit a row per cart — too small a cap truncates the JSON mid-object.
const BATCH_MAX_OUTPUT_TOKENS = 8192;

// Studying every cart on a 100-row page would blow the output budget (and cost),
// so cap how many carts go into one batch request. The highest-value carts are
// the ones worth tiering, so callers should pass those first.
export const SMART_BATCH_CART_LIMIT = 40;

// Structured-output schema: guarantees the model returns valid JSON in this
// exact shape, so no fence-stripping / brace-slicing guesswork is needed.
const batchResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    insights: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    tiers: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          cart_number: { type: SchemaType.STRING },
          discount_percent: { type: SchemaType.NUMBER },
          reason: { type: SchemaType.STRING },
        },
        required: ["cart_number", "discount_percent", "reason"],
      },
    },
  },
  required: ["insights", "tiers"],
};

const buildBatchPrompt = (carts: ICartAiInput[]): string => {
  const currency = carts[0]?.currency || "USD";
  const rows = carts
    .map(
      (cart) =>
        `${cart.cartNumber} | total=${cart.cartTotal.toFixed(2)} | age=${cart.cartAgeDays}d`,
    )
    .join("\n");

  return `You are a retail promotion strategist. Study the abandoned carts below.
Each row is: cart_number | cart_total (in ${currency}) | cart_age_in_days.

Cart data:
${rows}

Do two things:
1. Give 2-4 short batch-level promotion insights based on the spread of cart totals
   and ages (e.g. a free-shipping threshold nudge, an urgency campaign for stale carts,
   a tiered discount campaign).
2. Assign ONE percentage discount to EACH cart using an INVERSE tier: higher-value
   carts get a SMALLER percent, lower-value carts get a LARGER percent (never give the
   same percent to everyone). Scale the tiers to the actual range of totals present.
   Keep every discount between 5% and 30%.

Return ONLY valid minified JSON, no markdown, in this exact schema:
{"insights":["..."],"tiers":[{"cart_number":"...","discount_percent":10,"reason":"max 12 words"}]}`;
};

/**
 * Recovers complete tier objects from a truncated JSON string. When the model
 * hits the output cap mid-array the whole JSON.parse fails, but the objects that
 * arrived before the cut-off are still valid — grep them out individually so a
 * truncated response still yields usable suggestions.
 */
const salvageTiers = (
  jsonSlice: string,
): Array<{ cart_number?: string; discount_percent?: number; reason?: string }> => {
  const objects: Array<{
    cart_number?: string;
    discount_percent?: number;
    reason?: string;
  }> = [];
  // Match each {...} object inside the (possibly unterminated) tiers array.
  const objectPattern = /\{[^{}]*\}/g;
  const matches = jsonSlice.match(objectPattern) || [];
  for (const raw of matches) {
    try {
      const obj = JSON.parse(raw);
      if (obj && typeof obj.cart_number === "string") objects.push(obj);
    } catch {
      // Skip a partial trailing object.
    }
  }
  return objects;
};

/** Strips markdown fences and parses the model's JSON batch response. */
const parseBatchResponse = (
  text: string,
  carts: ICartAiInput[],
): IAiBatchSuggestion => {
  const totalByCart = new Map(carts.map((c) => [c.cartNumber, c.cartTotal]));

  // With a response schema the text is already clean JSON, but strip an
  // accidental ```json fence and slice to the outermost {...} just in case.
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const jsonSlice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : "";

  let parsed: {
    insights?: unknown;
    tiers?: Array<{
      cart_number?: string;
      discount_percent?: number;
      reason?: string;
    }>;
  };
  try {
    parsed = JSON.parse(jsonSlice);
  } catch {
    // The response was likely truncated (e.g. finishReason MAX_TOKENS), leaving
    // the JSON cut off mid-array. Rather than lose everything, salvage the tier
    // objects that DID arrive complete before the cut-off.
    // eslint-disable-next-line no-console
    console.error("Gemini batch response could not be parsed; salvaging. Raw text:", text);
    const salvaged = salvageTiers(jsonSlice);
    if (salvaged.length === 0) {
      throw new Error("The AI response could not be parsed. Please try again.");
    }
    parsed = { insights: [], tiers: salvaged };
  }

  const insights = Array.isArray(parsed.insights)
    ? parsed.insights.filter((i): i is string => typeof i === "string")
    : [];

  const tiers: IAiCartTier[] = (parsed.tiers || [])
    .filter((t) => t.cart_number && totalByCart.has(t.cart_number))
    .map((t) => ({
      cartNumber: t.cart_number as string,
      cartTotal: totalByCart.get(t.cart_number as string) ?? 0,
      // Clamp defensively to the 5–30% band the prompt asked for.
      discountPercent: Math.min(30, Math.max(5, Number(t.discount_percent) || 0)),
      reason: t.reason || "",
    }));

  return { insights, tiers };
};

/**
 * Studies Cart Total + Cart Age across all supplied carts and returns batch
 * promotion insights plus an inverse-tiered per-cart discount. Only totals and
 * ages are sent (no line items/PII) to keep the request small.
 */
export const getSmartBatchSuggestions = async (
  carts: ICartAiInput[],
): Promise<IAiBatchSuggestion> => {
  if (carts.length === 0) return { insights: [], tiers: [] };

  // Cap the batch so the response fits the output budget and stays cheap.
  const batch = carts.slice(0, SMART_BATCH_CART_LIMIT);

  const model = getClient().getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      maxOutputTokens: BATCH_MAX_OUTPUT_TOKENS,
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema: batchResponseSchema,
      // Disable "thinking": the newer flash models reason before answering,
      // which burns the output budget and truncates the JSON (finishReason
      // MAX_TOKENS). We only need the answer, so give thinking zero budget.
      // Not in the legacy SDK's typed config, so passed through via cast.
      thinkingConfig: { thinkingBudget: 0 },
    } as GenerationConfig,
  });

  const result = await model.generateContent(buildBatchPrompt(batch));
  const response = result.response;
  const truncated =
    response.candidates?.[0]?.finishReason === FinishReason.MAX_TOKENS;

  if (truncated) {
    // eslint-disable-next-line no-console
    console.warn(
      "Gemini batch response hit MAX_TOKENS and may be truncated; salvaging what arrived.",
    );
  }

  // response.text() can throw when the candidate didn't finish cleanly, so pull
  // the raw text out of the parts directly and let the parser salvage it.
  const rawText =
    response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("") || "";

  return parseBatchResponse(rawText, batch);
};
