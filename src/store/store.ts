import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import rootReducer from "./Slices";
import { errorLoggingMiddleware } from "./Middlewares/errorLoggingMiddleware";

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(errorLoggingMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
