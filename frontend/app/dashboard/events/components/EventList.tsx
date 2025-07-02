"use client";

import { RefreshButton } from "@/components/Buttons";
import { SearchField } from "@/components/molecules/form/SearchField";
import { IVendorEventListItem } from "@/types/event.types";
import { EventCard } from "./EventCard";
import useEvent from "./useEvent";

export default function EventList() {
	const { events, refetchEvents, refreshingEvents } = useEvent({
		fetchEvents: true,
	});

	console.log("events ->", events);

	return (
		<div>
			<div className="flex items-center gap-2">
				<SearchField placeholder="Search events" />
				<RefreshButton
					refetch={refetchEvents}
					isRefetching={refreshingEvents}
				/>
			</div>

			<div className="mt-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
				{events?.results.map((evt: IVendorEventListItem) => (
					<EventCard event={evt} />
				))}
			</div>
		</div>
	);
}
