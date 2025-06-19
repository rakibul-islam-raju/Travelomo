import { MeVendor } from "@/types/vendor.types";
import { create } from "zustand";

interface VendorStore {
	vendor?: MeVendor;
	setVendor: (vendor: MeVendor) => void;
}

export const useVendorStore = create<VendorStore>((set) => ({
	isAuthenticated: false,
	user: undefined,
	setVendor: (vendor) => set({ vendor }),
}));
