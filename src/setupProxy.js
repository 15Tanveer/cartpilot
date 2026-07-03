/* eslint-disable no-undef, @typescript-eslint/no-require-imports */
// CommonJS on purpose: react-scripts loads this file with require() in Node.
const { createProxyMiddleware } = require("http-proxy-middleware");

/**
 * Forwards /cdn-images/* to the Znode CDN. The CDN serves product images
 * without CORS headers, so the browser refuses to hand them to a canvas
 * (needed by the PDF export to embed thumbnails). Requesting them through
 * this same-origin path sidesteps CORS entirely during development.
 */
module.exports = function (app) {
  app.use(
    "/cdn-images",
    createProxyMiddleware({
      target: process.env.REACT_APP_CDN_URL || "https://cdn-gswr-np.znodecorp.com",
      changeOrigin: true,
      pathRewrite: { "^/cdn-images": "" },
    }),
  );
};
