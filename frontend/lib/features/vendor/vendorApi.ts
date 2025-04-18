import { baseApi } from "@/lib/baseApi";
import { IVendor } from "@/models/Vendor";

export const vendorApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getVendorDetails: builder.query<IVendor, string | undefined>({
			query: (id) => ({
				url: `/vendors/${id}`,
				method: "GET",
			}),
			providesTags: ["Vendor"],
		}),
	}),
});

export const { useGetVendorDetailsQuery } = vendorApi;
