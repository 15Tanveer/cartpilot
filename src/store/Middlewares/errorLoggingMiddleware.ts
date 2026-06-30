import { isRejectedWithValue, Middleware } from "@reduxjs/toolkit";

export const errorLoggingMiddleware: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    // notificationController.error({ message: action.payload });
  }

  return next(action);
};
