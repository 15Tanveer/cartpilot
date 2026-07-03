/**
 * EmailJS templates the user can choose from when triggering recovery /
 * promotion emails. Shared by the Send Promotion modal and the Smart AI modal.
 * The ids must match the template ids configured in the EmailJS dashboard.
 */
export interface IEmailTemplateOption {
  id: string;
  name: string;
}

export const EMAIL_TEMPLATES: IEmailTemplateOption[] = [
  { id: "template_d0tvlfg", name: "Abandoned Cart Template" },
  { id: "template_itmdngd", name: "Welcome" },
];

/** The template selected by default (the abandoned-cart one). */
export const DEFAULT_EMAIL_TEMPLATE_ID = EMAIL_TEMPLATES[0].id;
