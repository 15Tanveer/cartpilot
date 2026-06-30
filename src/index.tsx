import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { Provider } from "react-redux";
import { store } from "./store/store";
import "./index.css";

// Guard against cross-origin SecurityErrors thrown by Ant Design (rc-image) internals
// when this app runs inside a cross-origin iframe. event.error may be null in some
// browsers for cross-origin errors, so we fall back to checking event.message.
window.addEventListener("error", (event) => {
  const errorName =
    event.error?.name ?? event.message?.match(/^(\w*Error):/)?.[1];
  const errorMessage = event.message || event.error?.message || "";

  const isCrossOriginSecurityError =
    errorName === "SecurityError" &&
    /removeEventListener|cross-origin frame/i.test(errorMessage);

  if (isCrossOriginSecurityError) {
    // preventDefault suppresses the browser console error.
    // stopImmediatePropagation prevents React's own window error handler
    // from seeing it and unmounting the React tree (blank page).
    event.preventDefault();
    event.stopImmediatePropagation();
  }
});

const root = createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <Provider store={store}>
    <App />
  </Provider>,
);
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
