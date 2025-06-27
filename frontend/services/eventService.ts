import { EventFormValues } from "@/app/dashboard/events/create-event/components/schema";
import { fetcher } from "@/lib/fetcher";
import { GenericListResponse } from "@/types/common";
import * as EventTypes from "@/types/event.types";

export const eventServices = {
	getEventsForVendor: async (params?: { [key: string]: string }) => {
		return await fetcher<GenericListResponse<EventTypes.IVendorEventListItem>>(
			"/events/vendor-event/",
			{ method: "GET", params }
		);
	},

	createEvent: async (data: EventTypes.ICreateEvent) => {
		return await fetcher<EventTypes.IVendorEventListItem>(
			"/events/vendor-event/",
			{
				method: "POST",
				body: data,
			}
		);
	},

	updateEvent: async (data: Partial<EventFormValues>, id: number) => {
		return await fetcher<EventTypes.IVendorEventListItem>(
			`/events/vendor-event/${id}`,
			{ method: "PATCH", body: data }
		);
	},

	deleteEvent: async (id: number) => {
		return await fetcher(`/events/vendor-event/${id}`, {
			method: "DELETE",
		});
	},
};
