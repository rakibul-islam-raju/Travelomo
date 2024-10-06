import { jwtDecode } from "jwt-decode";
import { localStorageKeys } from "../config";

const setItem = (key, data) => {
	const strValue = JSON.stringify(data);
	localStorage.setItem(key, strValue);
};

const getItem = (key) => {
	const value = localStorage.getItem(key) ? localStorage.getItem(key) : null;

	if (value) {
		const data = JSON.parse(value);
		return data;
	}
	return null;
};

const removeItem = (key) => {
	localStorage.removeItem(key);
};

const setAuthTokens = (tokens) => {
	if (tokens) {
		const strTokens = JSON.stringify(tokens);
		localStorage.setItem(localStorageKeys.authKey, strTokens);
	}
};

const getAuthTokens = () => {
	const tokens = localStorage.getItem(localStorageKeys.authKey);
	if (tokens) {
		const parsedTokens = JSON.parse(tokens);
		return parsedTokens;
	}
	return null;
};

const getUser = () => {
	const serializedValue = getAuthTokens();

	if (serializedValue) {
		const userData = jwtDecode(serializedValue?.access);
		return userData;
	}
	return null;
};

const removeAuthTokens = () => {
	localStorage.removeItem(localStorageKeys.authKey);
};

const setUserType = (info) => {
	const userType = info?.user_type ?? null;

	const strValue = JSON.stringify(userType);
	localStorage.setItem(localStorageKeys.userTypeKey, strValue);
};

const getUserType = () => {
	const value = localStorage.getItem(localStorageKeys.userTypeKey);
	if (value) {
		const userType = JSON.parse(value);
		return userType;
	}
	return null;
};

const setAuthState = ({ state, service }) => {
	setItem(localStorageKeys.authState, { state, service });
};

const getAuthState = () => {
	return getItem(localStorageKeys.authState);
};

const setFirstTimeUser = () => {
	setItem(localStorageKeys.firstTimeUser, true);
};

const getFirstTimeUser = () => {
	return getItem(localStorageKeys.firstTimeUser);
};

const removeFirstTimeUser = () => {
	removeItem(localStorageKeys.firstTimeUser);
};

export const localStorageService = {
	setAuthTokens,
	getAuthTokens,
	getUser,
	removeAuthTokens,
	setUserType,
	getUserType,
	setAuthState,
	getAuthState,
	setItem,
	getItem,
	removeItem,
	setFirstTimeUser,
	getFirstTimeUser,
	removeFirstTimeUser,
};
