import { serverFetcher } from "@/lib/serverFetcher";
import { IVendorEventDetails } from "@/types/event.types";
import { Metadata } from "next";
import { EventForm } from "../../create-event/components/EventForm";

export const metadata: Metadata = {
	title: "Edit Event",
};

const fetchEvent = async (id: string) => {
	const response = await serverFetcher<IVendorEventDetails>(
		`/events/vendor-event/${id}`
	);
	return response;
};

export default async function CreateEvent({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const event = await fetchEvent(id);

	console.log("event -->", event);

	return (
		<>
			<h2 className="text-2xl font-medium mb-6">Create New Event</h2>
			<EventForm />
		</>
	);
}
