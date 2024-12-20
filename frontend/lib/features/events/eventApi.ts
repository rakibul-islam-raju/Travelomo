import { baseApi } from "@/lib/baseApi";
import { IEventListItem, IEventListParams } from "@/models/Event";
import { GenericListResponse } from "@/types/common";

export const eventApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getEvents: builder.query<
			GenericListResponse<IEventListItem>,
			IEventListParams
		>({
			query: (params) => ({
				url: `/events`,
				method: "GET",
				params,
			}),
			providesTags: ["Events"],
		}),
	}),
});

export const { useGetEventsQuery } = eventApi;
