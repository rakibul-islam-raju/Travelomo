import { BASE_API_URL } from "@config/index";
import { localStorageService } from "@services/localStorageService";
import axios from "axios";

export const axiosInstance = axios.create({
	baseURL: BASE_API_URL,
	timeout: 10000,
	headers: {
		"Content-Type": "application/json",
	},
});

let isRefreshing = false;
const refreshQueue = [];
const mutex = axios.CancelToken.source();

// interceptors
axiosInstance.interceptors.request.use(async (req) => {
	const authTokens = localStorageService.getAuthTokens();
	const access = authTokens?.access;

	if (access) {
		req.headers.Authorization = `Bearer ${access}`;
	}

	return req;
});

axiosInstance.interceptors.response.use(
	function (response) {
		// Do something with response data
		return response;
	},
	async function (error) {
		const originalRequest = error.config;

		if (error.response?.status === 401 && !originalRequest._retry) {
			// Check if the request is a login request
			if (originalRequest.url.includes("/login/")) {
				return Promise.reject(error);
			}

			originalRequest._retry = true;

			const refreshToken = localStorageService.getAuthTokens()?.refresh;

			if (!isRefreshing) {
				isRefreshing = true;

				try {
					const refreshResponse = await axios.post(
						`${BASE_API_URL}/refresh-token/`,
						{
							refresh: refreshToken,
						},
						{ cancelToken: mutex.token }
					);

					const { access, refresh } = refreshResponse.data;

					localStorageService.setAuthTokens({ access, refresh });

					originalRequest.headers.Authorization = `Bearer ${access}`;

					// Allow subsequent requests to proceed
					isRefreshing = false;

					// Process any queued requests with the new access token
					refreshQueue.forEach((cb) => cb(null, access));

					return axios(originalRequest);
				} catch (refreshError) {
					localStorageService.removeAuthTokens();

					// Allow subsequent requests to proceed
					isRefreshing = false;

					// Reject any queued requests with the refresh error
					refreshQueue.forEach((cb) => cb(refreshError));

					return Promise.reject(refreshError);
				}
			} else {
				// If a refresh is already in progress, enqueue the request
				return new Promise((resolve, reject) => {
					refreshQueue.push((error, newAccessToken) => {
						if (error) {
							reject(error);
						} else {
							originalRequest.headers.Authorization = `Bearer ${
								newAccessToken || localStorageService.getAuthTokens()?.access
							}`;
							resolve(axios(originalRequest));
						}
					});
				});
			}
		}

		return Promise.reject(error);
	}
);
