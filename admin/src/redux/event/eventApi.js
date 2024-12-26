import { baseApi } from "@redux/baseApi";

export const eventApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getEvents: builder.query({
			query: (params) => {
				return {
					url: `/events/admin-event/`,
					method: "GET",
					params: params,
				};
			},
			providesTags: ["Event"],
		}),

		getEventDetails: builder.query({
			query: (id) => ({
				url: `/vendors/${id}/`,
				method: "GET",
			}),
			providesTags: ["EventDetails"],
		}),
	}),
});

export const { useGetEventsQuery, useGetEventDetailsQuery } = eventApi;
