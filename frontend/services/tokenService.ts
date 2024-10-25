import { AuthTokens } from "@/types/common";
import Cookies from "js-cookie";

const ACCESS_TOKEN_COOKIE = "access";
const REFRESH_TOKEN_COOKIE = "refresh";

const getAuthTokens = (): AuthTokens | null => {
	const access = Cookies.get(ACCESS_TOKEN_COOKIE);
	const refresh = Cookies.get(REFRESH_TOKEN_COOKIE);

	if (access && refresh) {
		return { access, refresh };
	}
	return null;
};

const setAuthTokens = (tokens: AuthTokens) => {
	Cookies.set(ACCESS_TOKEN_COOKIE, tokens.access, {
		secure: true,
		sameSite: "strict",
	});
	Cookies.set(REFRESH_TOKEN_COOKIE, tokens.refresh, {
		secure: true,
		sameSite: "strict",
	});
};

const clearAuthTokens = () => {
	Cookies.remove(ACCESS_TOKEN_COOKIE);
	Cookies.remove(REFRESH_TOKEN_COOKIE);
};

export const tokenService = {
	getAuthTokens,
	setAuthTokens,
	clearAuthTokens,
};
