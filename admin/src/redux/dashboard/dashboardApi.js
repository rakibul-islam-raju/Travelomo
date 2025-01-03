import { baseApi } from "@redux/baseApi";

export const dashboardApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getDashboardCountStats: builder.query({
			query: () => {
				return {
					url: `/stats/dashboard/counts/`,
					method: "GET",
				};
			},
		}),
	}),
});

export const { useGetDashboardCountStatsQuery } = dashboardApi;
