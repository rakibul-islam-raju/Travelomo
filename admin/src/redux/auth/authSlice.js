import { createSlice } from "@reduxjs/toolkit";
import { localStorageService } from "../../services/localStorageService";

const authData = localStorageService.getAuthTokens();

const initialState = {
	access: authData?.access ?? null,
	refresh: authData?.refresh ?? null,
	user: localStorageService.getUser()?.user ?? null,
};

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		userLoggedIn(state, action) {
			state.access = action.payload.access;
			state.refresh = action.payload.refresh;

			localStorageService.setAuthTokens(action.payload);
		},
		userLoggedOut(state) {
			state.access = null;
			state.refresh = null;
			state.user = null;

			localStorageService.removeAuthTokens();
			localStorage.clear();
			window.location.href = "/signin";
		},
		setUserInfo(state, action) {
			state.user = action.payload;
		},
	},
});

export const { userLoggedIn, userLoggedOut, setUserInfo } = authSlice.actions;
export default authSlice.reducer;
