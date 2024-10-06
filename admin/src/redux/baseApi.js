import { BASE_API_URL } from "@config/index";
import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@utils/axios/axiosBaseQuery";

export const baseApi = createApi({
	reducerPath: "api",
	baseQuery: axiosBaseQuery({
		baseUrl: BASE_API_URL,
	}),
	tagTypes: [],
	endpoints: () => ({}),
});
