import { Metadata } from "next";
import { DashboardPageContainer } from "../_components/DashboardPageContainer";
import VendorBookingList from "./_components/VendorBookingList";

export const metadata: Metadata = {
	title: "Bookings",
};

export default function BookingsPage() {
	return (
		<DashboardPageContainer>
			<DashboardPageContainer.Header>
				<DashboardPageContainer.Title>Bookings</DashboardPageContainer.Title>
			</DashboardPageContainer.Header>
			<DashboardPageContainer.Content>
				<VendorBookingList />
			</DashboardPageContainer.Content>
		</DashboardPageContainer>
	);
}
