import { IAccessCheckResult } from "../../interfaces/clientInterfaces/common";

/**
 * Check if code is running inside an iframe
 * @returns true if running in iframe, false otherwise
 */
export function isRunningInIframe(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.self !== window.top;
}

/**
 * Check if running in development environment
 * Includes NODE_ENV check and localhost/local IP detection
 * @returns true if in development, false otherwise
 */
export function isDevEnvironment(): boolean {
  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "development";
  }
  return (
    process.env.NODE_ENV === "development" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.")
  );
}

/**
 * Validate iframe referrer against allowed parent URLs
 * In development: Always allows access
 * In production with iframe: Validates referrer against whitelist
 * In production without iframe: Blocks direct access if parent URLs are configured
 *
 * @param allowedParentUrls - Array of allowed parent URLs
 * @returns IAccessCheckResult with allowed status and reason info
 */
export function checkIframeReferrer(
  allowedParentUrls: string[]
): IAccessCheckResult {
  // Always allow in development environment
  const isDev = isDevEnvironment();
  if (isDev) {
    return {
      allowed: true,
      referrerInfo: "Development mode - No restrictions applied",
    };
  }

  // Check if running in browser
  if (typeof window === "undefined") {
    return { allowed: true, referrerInfo: "" };
  }

  const inIframe = isRunningInIframe();
  const referrer = document.referrer;

  // If running in iframe, validate referrer
  if (inIframe) {
    // If no referrer in iframe, deny access
    if (!referrer) {
      return {
        allowed: false,
        referrerInfo:
          "Missing referrer - This component must be accessed from an authorized admin page",
      };
    }

    try {
      // Check if referrer starts with any allowed parent URL
      const isAllowed = allowedParentUrls.some((url) =>
        referrer.startsWith(url)
      );

      if (isAllowed) {
        return {
          allowed: true,
          referrerInfo: `Access granted from: ${referrer}`,
        };
      }

      return {
        allowed: false,
        referrerInfo: `Unauthorized referrer: ${referrer}`,
      };
    } catch {
      return {
        allowed: false,
        referrerInfo: "Invalid referrer format or unauthorized access",
      };
    }
  }

  // Not in iframe - only allow if we have valid allowed parent URLs configured
  // If no allowed parent URLs are configured, allow direct access
  if (allowedParentUrls.length === 0) {
    return {
      allowed: true,
      referrerInfo: "No iframe parent URLs configured - Direct access allowed",
    };
  }

  // If allowed parent URLs are configured but not in iframe, deny
  return {
    allowed: false,
    referrerInfo:
      "Direct access denied - This component must be accessed from the authorized admin panel via iframe",
  };
}
