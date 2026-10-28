export const queryKeys = {
	myBookings: ["MyBookings"] as const,
	vendorBookings: ["VendorBookings"] as const,
	allEventAvailability: ["EventAvailability"] as const,
	eventAvailability: (eventId: string) => ["EventAvailability", eventId] as const,
};
