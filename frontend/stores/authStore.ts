import { User } from "@/types";
import { create } from "zustand";

interface AuthStore {
	isAuthenticated: boolean;
	user?: User;
	setUser: (user: User) => void;
	clearUser: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
	isAuthenticated: false,
	user: undefined,
	setUser: (user) => set({ user, isAuthenticated: true }),
	clearUser: () => set({ user: undefined, isAuthenticated: false }),
}));
