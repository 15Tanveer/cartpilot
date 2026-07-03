/**
 * EmailJS templates the user can choose from when triggering recovery /
 * promotion emails. Shared by the Send Promotion modal and the Smart AI modal.
 * The ids must match the template ids configured in the EmailJS dashboard.
 */
export interface IEmailTemplateOption {
  id: string;
  name: string;
}

/** Template ids referenced by meaning so callers don't hardcode the raw ids. */
export const ABANDONED_CART_TEMPLATE_ID = "template_d0tvlfg";
export const WELCOME_TEMPLATE_ID = "template_itmdngd";

export const EMAIL_TEMPLATES: IEmailTemplateOption[] = [
  { id: ABANDONED_CART_TEMPLATE_ID, name: "Abandoned Cart Template" },
  { id: WELCOME_TEMPLATE_ID, name: "Welcome" },
];

/** The template selected by default (the abandoned-cart one). */
export const DEFAULT_EMAIL_TEMPLATE_ID = EMAIL_TEMPLATES[0].id;

/**
 * Returns the templates a context is allowed to use. When `allowedIds` is given,
 * only those templates are returned (in their canonical order); otherwise all.
 */
export const getAllowedTemplates = (
  allowedIds?: string[],
): IEmailTemplateOption[] =>
  allowedIds && allowedIds.length > 0
    ? EMAIL_TEMPLATES.filter((t) => allowedIds.includes(t.id))
    : EMAIL_TEMPLATES;
