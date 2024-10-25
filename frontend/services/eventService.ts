import { RESULT_PER_PAGE } from "@/config/siteConfig";
import { apiFetch } from "@/lib/fatchInstance";
import { GenericListResponse } from "@/types/common";
import { EventListItem } from "@/types/event";

const fetchEvents = async (
	limit: number = RESULT_PER_PAGE,
	offset: number = 0
): Promise<GenericListResponse<EventListItem>> => {
	return apiFetch(`/events?limit=${limit}&offset=${offset}`);
};

const fetchFeaturedEvents = async (): Promise<
	GenericListResponse<EventListItem>
> => {
	return fetchEvents(8, 0);
};

export const eventService = {
	fetchFeaturedEvents,
	fetchEvents,
};
