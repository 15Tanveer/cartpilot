import DOMPurify from "dompurify";

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = (html: string | undefined | null): string => {
  if (!html) return "";

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ol",
      "ul",
      "li",
      "a",
      "img",
      "video",
      "blockquote",
      "pre",
      "code",
      "span",
      "div",
      "sub",
      "sup",
    ],
    ALLOWED_ATTR: [
      "href",
      "target",
      "rel",
      "src",
      "alt",
      "width",
      "height",
      "class",
      "style",
      "title",
      "controls",
    ],
  });
};

/**
 * Sanitizes rich text editor content, removing only security-related risks
 * (scripts, event handlers, dangerous URLs) while preserving all editor
 * formatting such as font color, background color, alignment, etc.
 *
 * Uses DOMPurify's secure defaults (a blocklist of XSS vectors) instead of a
 * restrictive allowlist, so legitimate styling is never trimmed.
 *
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string with formatting preserved
 */
export const sanitizeRichTextContent = (
  html: string | undefined | null,
): string => {
  if (!html) return "";

  const cleaned = DOMPurify.sanitize(html);

  return cleaned;
};
