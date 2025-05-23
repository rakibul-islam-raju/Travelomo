export const BASE_API_URL: string =
	process.env.BASE_API_URL || "http://localhost:8000/api/v1";
export const RESULT_PER_PAGE: number = 12;
export const NODE_ENV = process.env.NODE_ENV;

export const initialParams = {
	limit: RESULT_PER_PAGE,
	offset: 0,
};

export const COOKIE_CONSTS = {
	ACCESS: "access",
	REFRESH: "refresh",
	IS_LOGGED_IN: "logged_in",
};
