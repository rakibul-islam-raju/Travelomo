import { combineReducers, configureStore } from "@reduxjs/toolkit";

import { baseApi } from "./baseApi";
import cummonSlice from "./common/commonSlice";

const rootReducer = combineReducers({
	[baseApi.reducerPath]: baseApi.reducer,
	common: cummonSlice,
});

const store = configureStore({
	reducer: rootReducer,
	devTools: true, //import.meta.env.DEV,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat(baseApi.middleware),
});

export default store;
