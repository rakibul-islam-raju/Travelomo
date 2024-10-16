import { baseApi } from "@redux/baseApi";

export const vendorApi = baseApi.injectEndpoints({
	endpoints: (builder) => ({
		getVendors: builder.query({
			query: (params) => {
				return {
					url: `/vendors/`,
					method: "GET",
					params: params,
				};
			},
			providesTags: ["Vendor"],
		}),

		getVendorDetails: builder.query({
			query: (id) => ({
				url: `/vendors/${id}/`,
				method: "GET",
			}),
			providesTags: ["VendorDetails"],
		}),

		approveVendor: builder.mutation({
			query: ({ id, data }) => ({
				url: `/vendors/${id}/approval/`,
				method: "PATCH",
				data,
			}),
			invalidatesTags: ["Vendor", "VendorDetails"],
		}),
	}),
});

export const {
	useGetVendorsQuery,
	useGetVendorDetailsQuery,
	useApproveVendorMutation,
} = vendorApi;
