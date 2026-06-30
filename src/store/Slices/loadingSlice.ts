import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface LoadingState {
  [key: string]: boolean;
}

const initialState: LoadingState = {};

export const loadingSlice = createSlice({
  name: "loading",
  initialState,
  reducers: {
    setLoaderState(
      state,
      action: PayloadAction<{ actionType: string; isLoading: boolean }>,
    ) {
      const { actionType, isLoading } = action.payload;
      state[actionType] = isLoading;
    },
  },
});

export const { setLoaderState } = loadingSlice.actions;
export default loadingSlice.reducer;
