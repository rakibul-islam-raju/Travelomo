import { baseApi } from "@/lib/baseApi";
import { IVendor } from "@/models/Vendor";

interface IVendorSummary {
	total_completed_events: number;
	total_running_events: number;
	total_user_travelled: number;
	total_earnings: number;
}

interface IVendorEventsPieChart {
	total_published_events: number;
	total_draft_events: number;
	total_completed_events: number;
	total_cancelled_events: number;
	total_archived_events: number;
	[key: string]: number;
}

interface IVendorRegisteredTravelers {
	[key: string]: number;
}

export const vendorApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getVendorDetails: builder.query<IVendor, string | undefined>({
			query: (id) => ({
				url: `/vendors/${id}`,
				method: "GET",
			}),
			providesTags: ["Vendor"],
		}),

		getVendorSummary: builder.query<IVendorSummary, undefined>({
			query: () => ({
				url: `/stats/vendor/dashboard-summary/`,
				method: "GET",
			}),
			providesTags: ["VendorSummary"],
		}),

		getVendorEventsPieChartData: builder.query<
			IVendorEventsPieChart,
			{ start_date: string; end_date: string }
		>({
			query: ({ start_date, end_date }) => ({
				url: `/stats/vendor/event-pie-chart/`,
				method: "GET",
				params: { start_date, end_date },
			}),
			providesTags: ["VendorEventsPieChart"],
		}),

		getVendorRegisteredTravelers: builder.query<
			IVendorRegisteredTravelers[],
			string | undefined
		>({
			query: (type) => ({
				url: `/stats/vendor/registered-travellers/`,
				method: "GET",
				params: { report_type: type },
			}),
			providesTags: ["VendorRegisteredTravelers"],
		}),
	}),
});

export const {
	useGetVendorDetailsQuery,
	useGetVendorSummaryQuery,
	useGetVendorEventsPieChartDataQuery,
	useGetVendorRegisteredTravelersQuery,
} = vendorApi;
