"use client";

import { AddButton, RefreshButton } from "@/components/Buttons";
import { SearchField } from "@/components/molecules/form/SearchField";
import { DashboardPageContainer } from "../_components/DashboardPageContainer";

const Events = () => {
	const handleRefetch = () => {
		console.log("refrech");
	};

	return (
		<DashboardPageContainer>
			<DashboardPageContainer.Header>
				<DashboardPageContainer.Title>Events</DashboardPageContainer.Title>
				<div className="flex items-center gap-2">
					<RefreshButton refetch={handleRefetch} isRefetching={false} />
					<AddButton
						href="/dashboard/events/create-event"
						text="Create Event"
					/>
				</div>
			</DashboardPageContainer.Header>
			<DashboardPageContainer.Content>
				<SearchField placeholder="Search events" />
			</DashboardPageContainer.Content>
		</DashboardPageContainer>
	);
};

export default Events;
