import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "next-auth";

// Extend the default User type with tokens
export interface ExtendedUser extends User {
	tokens: {
		access: string;
		refresh: string;
	};
	user_id: string;
	role: "customer" | "vendor" | "admin";
	is_active: boolean;
}

interface AuthState {
	user: ExtendedUser | null;
	isAuthenticated: boolean;
}

const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
};

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		setUser: (state, action: PayloadAction<ExtendedUser | null>) => {
			state.user = action.payload;
			state.isAuthenticated = !!action.payload;
		},
		logout: (state) => {
			state.user = null;
			state.isAuthenticated = false;
		},
	},
	selectors: {
		selectCurrentUser: (state) => state.user,
		selectIsAuthenticated: (state) => state.isAuthenticated,
		selectUserRole: (state) => state.user?.role,
	},
});

export const { setUser, logout } = authSlice.actions;
export const { selectCurrentUser, selectIsAuthenticated, selectUserRole } =
	authSlice.selectors;

export default authSlice.reducer;
