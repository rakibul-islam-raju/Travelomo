"use client";

import { RefreshButton } from "@/components/Buttons";
import { SearchField } from "@/components/molecules/form/SearchField";
import { useDebounce } from "@/hooks/useDebounce";
import { IEventFilter, IVendorEventListItem } from "@/types/event.types";
import Link from "next/link";
import { useState } from "react";
import { FilterDrawer } from "../../_components/FilterDrawer";
import { NoDataFound } from "../../_components/NoDataFound";
import { EventCard } from "./EventCard";
import { EventCardSkeleton } from "./EventCardSkeleton";
import { EventFilter } from "./EventFilter";
import useEvent from "./useEvent";

export default function EventList() {
	const [search, setSearch] = useState("");
	const [filters, setFilters] = useState<IEventFilter>({});

	const debouncedSearch = useDebounce(search);

	const { events, fetchingEvents, refetchEvents, refreshingEvents } = useEvent({
		fetchEvents: true,
		filters: {
			...filters,
			search: debouncedSearch,
		},
	});

	const handleUpdateFilters = (params: IEventFilter) => {
		setFilters(params);
	};

	let content;

	if (fetchingEvents) {
		content = (
			<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
				{[...Array(6).keys()].map((i) => (
					<EventCardSkeleton key={i} />
				))}
			</div>
		);
	}

	if (events?.results && events?.results.length === 0) {
		content = <NoDataFound />;
	}

	if (events?.results && events?.results.length > 0) {
		content = (
			<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
				{events?.results.map((evt: IVendorEventListItem) => (
					<Link prefetch href={`/dashboard/events/${evt.id}`} key={evt.id}>
						<EventCard event={evt} />
					</Link>
				))}
			</div>
		);
	}

	return (
		<div>
			<div className="flex justify-between items-center gap-2">
				<div className="flex items-center gap-2">
					<SearchField
						placeholder="Search events"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					<RefreshButton
						refetch={refetchEvents}
						isRefetching={refreshingEvents}
					/>
				</div>
				<FilterDrawer>
					<EventFilter
						handleUpdateFilters={handleUpdateFilters}
						filters={filters}
					/>
				</FilterDrawer>
			</div>

			<div className="mt-6">{content}</div>
		</div>
	);
}
