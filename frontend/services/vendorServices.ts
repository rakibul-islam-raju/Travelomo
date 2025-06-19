import { fetcher } from "@/lib/fetcher";
import * as VendorTypes from "@/types/vendor.types";

export const vendorServices = {
	getMeVendor: async () => {
		return await fetcher<VendorTypes.MeVendorResponse>("/vendors/me/", {
			method: "GET",
		});
	},

	getVendorDetails: async (id: string) => {
		return await fetcher<VendorTypes.VendorDetails>(`/vendors/${id}`, {
			method: "GET",
		});
	},
};
