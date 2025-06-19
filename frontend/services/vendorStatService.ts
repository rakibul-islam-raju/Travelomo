import { fetcher } from "@/lib/fetcher";
import * as VendorTypes from "@/types/vendor.types";

export const vendorStatService = {
	getVendorSummary: async () => {
		return await fetcher<VendorTypes.IVendorSummary>(
			`/stats/vendor/dashboard-summary/`,
			{ method: "GET" }
		);
	},

	getVendorEventsPieChartData: async (start_date: string, end_date: string) => {
		return await fetcher<VendorTypes.IVendorEventsPieChart>(
			`/stats/vendor/event-pie-chart/`,
			{ method: "GET", params: { start_date, end_date } }
		);
	},

	getVendorRegisteredTravelers: async (type: string) => {
		return await fetcher<VendorTypes.IVendorRegisteredTravelers[]>(
			`/stats/vendor/registered-travellers/`,
			{ method: "GET", params: { report_type: type } }
		);
	},
};
