import { fetcher } from "@/lib/fetcher";
import * as VendorTypes from "@/types/vendor.types";

export const vendorServices = {
	getMeVendor: async () => {
		return await fetcher<VendorTypes.MeVendorResponse>("/vendors/me/", {
			method: "GET",
		});
	},

	getVendorDetails: async (id: string) => {
		return await fetcher<VendorTypes.VendorDetails>(`/vendors/${id}/`, {
			method: "GET",
		});
	},

	getPaymentMethods: async () => {
		return await fetcher<VendorTypes.VendorPaymentMethod[]>(
			"/vendors/payment-methods/"
		);
	},

	createPaymentMethod: async (data: VendorTypes.VendorPaymentMethodInput) => {
		return await fetcher<VendorTypes.VendorPaymentMethod>(
			"/vendors/payment-methods/",
			{ method: "POST", body: data }
		);
	},

	updatePaymentMethod: async (
		id: string,
		data: Partial<VendorTypes.VendorPaymentMethodInput>
	) => {
		return await fetcher<VendorTypes.VendorPaymentMethod>(
			`/vendors/payment-methods/${id}/`,
			{ method: "PATCH", body: data }
		);
	},

	deletePaymentMethod: async (id: string) => {
		return await fetcher<void>(`/vendors/payment-methods/${id}/`, {
			method: "DELETE",
		});
	},
};
