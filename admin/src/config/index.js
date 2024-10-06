export const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;

export const RESULT_PER_PAGE = 20;

export const APP_DEFAULT_PATH = "/";

export const initialParams = {
	limit: RESULT_PER_PAGE,
	offset: 0,
};

export const localStorageKeys = {
	expiry_at: "event_expiry_at",
	authKey: "event_Auth",
	userTypeKey: "event_userType",
	authState: "event_AuthState",
	regUserId: "event_RegUserID",
	forgetPasswordState: "event_ForgetPasswordState",
	joinWorkSpace: "event_join_workspace",
	firstTimeUser: "event_first_time_user",
};

export const DefaultUserImage = "/assets/images/default-user.webp";
