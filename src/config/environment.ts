/**
 * Environment Configuration
 * Different configurations for various environments
 */

export interface EnvironmentConfig {
  apiUrl: string;
  apiTimeout: number;
  appName: string;
  appVersion: string;
  debug: boolean;
  cdnUrl: string;
  allowedReferrerDomain: string;
  emailjsServiceId: string;
  emailjsTemplateId: string;
  emailjsPublicKey: string;
}

const isDevelopment = process.env.NODE_ENV === "development";

export const environmentConfig: EnvironmentConfig = {
  apiUrl: process.env.REACT_APP_API_URL || "http://localhost:3001/api",
  apiTimeout: parseInt(process.env.REACT_APP_API_TIMEOUT || "10000", 10),
  appName: process.env.REACT_APP_NAME || "Cartpilot",
  appVersion: process.env.REACT_APP_VERSION || "1.0.0",
  debug: isDevelopment,
  cdnUrl: process.env.REACT_APP_CDN_URL || "",
  allowedReferrerDomain: process.env.REACT_APP_ALLOWED_REFERRER_DOMAIN || "http://127.0.0.1:5500/",
  emailjsServiceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || "",
  emailjsTemplateId: process.env.REACT_APP_EMAILJS_TEMPLATE_ID || "",
  emailjsPublicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || "",
};

export default environmentConfig;
