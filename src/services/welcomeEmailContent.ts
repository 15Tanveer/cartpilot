/**
 * Campaign content for the Welcome email — the banner image and heading copy are
 * chosen from the promotion / coupon code so a "CHRISTMAS" code sends the
 * Christmas banner, "HALLOWEEN" the Halloween banner, and everything else falls
 * back to the neutral Clearance banner.
 */

/** A campaign's banner image plus the alt text and heading copy that go with it. */
export interface IWelcomeCampaign {
  /** Display name shown when picking a campaign in the UI, e.g. "Christmas". */
  label: string;
  /** Fully-qualified banner image URL (must be reachable on the public internet). */
  bannerImage: string;
  /** Alt text shown when the banner image can't load. */
  bannerAlt: string;
  /** 2–3 line heading copy rendered under/over the banner. */
  headingContent: string;
}

/** Neutral fallback used for any code that isn't a known seasonal campaign. */
export const CLEARANCE_CAMPAIGN: IWelcomeCampaign = {
  label: "Clearance",
  bannerImage:
    "https://cdn-gswr-np.znodecorp.com/znode10/30a52cd0-7123-4451-8cfc-a9797ca7774dclearance.png?v=0",
  bannerAlt: "Clearance sale banner",
  headingContent:
    "Big savings are waiting for you! Grab your exclusive discount before it's gone. " +
    "Shop your favourites now and save on every order.",
};

/**
 * Seasonal / campaign banners keyed by a token we look for inside the coupon
 * code. Order matters only for readability; matching is by substring below.
 */
export const WELCOME_CAMPAIGNS: Record<string, IWelcomeCampaign> = {
  christmas: {
    label: "Christmas",
    bannerImage:
      "https://cdn-gswr-np.znodecorp.com/znode10/52f210a9-4bad-455e-a673-f135ca42479cchristmas.png?v=0",
    bannerAlt: "Christmas sale banner",
    headingContent:
      "'Tis the season to save! Unwrap your exclusive Christmas discount today. " +
      "Treat yourself and your loved ones before the holidays are here.",
  },
  halloween: {
    label: "Halloween",
    bannerImage:
      "https://cdn-gswr-np.znodecorp.com/znode10/7d16427b-a018-409a-8176-6ad36a8c9dcehalloween.png?v=0",
    bannerAlt: "Halloween sale banner",
    headingContent:
      "Spooky savings are here! Claim your frightfully good Halloween discount. " +
      "Fill your cart with treats before this deal vanishes.",
  },
  clearance: CLEARANCE_CAMPAIGN,
};

/**
 * Picks the campaign (banner + heading) for a coupon code by looking for a known
 * campaign token inside the code (case-insensitive), e.g. "XMAS-CHRISTMAS-20"
 * matches Christmas. Falls back to the Clearance campaign for unknown / empty codes.
 */
export const resolveWelcomeCampaign = (code?: string): IWelcomeCampaign => {
  const normalized = (code || "").toLowerCase();
  for (const [token, campaign] of Object.entries(WELCOME_CAMPAIGNS)) {
    if (normalized.includes(token)) return campaign;
  }
  return CLEARANCE_CAMPAIGN;
};

/** Campaign entries as a `{ key, campaign }` list for UI pickers. */
export const WELCOME_CAMPAIGN_OPTIONS = Object.entries(WELCOME_CAMPAIGNS).map(
  ([key, campaign]) => ({ key, campaign }),
);

/**
 * Looks up a campaign by its exact key ("christmas", "halloween", "clearance"),
 * e.g. from the campaign picker in the Send Promotion modal. Returns undefined
 * for unknown / absent keys so callers can fall back to code-based resolution.
 */
export const getWelcomeCampaignByKey = (
  key?: string,
): IWelcomeCampaign | undefined =>
  key ? WELCOME_CAMPAIGNS[key.toLowerCase()] : undefined;
