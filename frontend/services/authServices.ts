import { internalApi } from "@/lib/axiosInstance";

export const authServices = {
	login: async (data: any) => {
		const response = await internalApi.post("/auth/login", data);
		return response.data;
	},

	register: async (data: any) => {
		const response = await internalApi.post("/auth/registration", data);
		return response.data;
	},
};
