import { NODE_ENV } from "@/config";

export const COOKIE_CONSTS = {
	ACCESS: "access",
	REFRESH: "refresh",
	IS_LOGGED_IN: "logged_in",
	SECURE: NODE_ENV === "production",
	ROLE: "role",
};
