import { baseApi } from "@redux/baseApi";
import { setUserInfo, userLoggedIn } from "./authSlice";

export const authApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getMe: builder.query({
			query: () => ({
				url: `/auth/me/`,
				method: "GET",
			}),
			providesTags: ["Me"],
			async onQueryStarted(_, { queryFulfilled, dispatch }) {
				const { data } = await queryFulfilled;

				dispatch(setUserInfo(data));
			},
		}),

		login: builder.mutation({
			query: (data) => ({
				url: "/auth/login/",
				method: "POST",
				data,
			}),
			async onQueryStarted(_, { queryFulfilled, dispatch }) {
				const { data } = await queryFulfilled;

				if (data?.access) {
					dispatch(
						userLoggedIn({
							access: data.access,
							refresh: data.refresh,
						})
					);

					dispatch(authApi.endpoints.getMe.initiate());
				}
			},
		}),
	}),
});

export const { useGetMeQuery, useLazyGetMeQuery, useLoginMutation } = authApi;
