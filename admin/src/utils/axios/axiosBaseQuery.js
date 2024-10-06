import {
	showMessage,
	startLoading,
	stopLoading,
} from "@redux/common/commonSlice";
import { extractErrorMessage } from "@utils/extractErrorMessage";
import { axiosInstance } from "./axiosInstance";

export const axiosBaseQuery =
	({ baseUrl = "" }) =>
	async ({ url, method, data, params, headers }, { dispatch }) => {
		try {
			// Set loading to true before API call
			dispatch(startLoading());

			const result = await axiosInstance({
				url: baseUrl + url,
				method,
				data,
				params,
				headers,
			});

			// stop loading
			dispatch(stopLoading());

			return { data: result.data };
		} catch (axiosError) {
			const err = axiosError;
			const errorMessage = extractErrorMessage(err.response);

			// stop loading
			dispatch(stopLoading());

			// Dispatch error message
			dispatch(
				showMessage({
					type: "error",
					content: errorMessage,
				})
			);

			return {
				error: {
					status: err.response?.status,
					data: errorMessage,
				},
			};
		}
	};
