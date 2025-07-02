import { AddButton } from "@/components/Buttons";
import { Metadata } from "next";
import { DashboardPageContainer } from "../_components/DashboardPageContainer";
import EventList from "./components/EventList";

export const metadata: Metadata = {
	title: "Event List",
};

const Events = () => {
	return (
		<DashboardPageContainer>
			<DashboardPageContainer.Header>
				<DashboardPageContainer.Title>Events</DashboardPageContainer.Title>
				<div className="flex items-center gap-2">
					<AddButton
						href="/dashboard/events/create-event"
						text="Create Event"
					/>
				</div>
			</DashboardPageContainer.Header>
			<DashboardPageContainer.Content>
				<EventList />
			</DashboardPageContainer.Content>
		</DashboardPageContainer>
	);
};

export default Events;
