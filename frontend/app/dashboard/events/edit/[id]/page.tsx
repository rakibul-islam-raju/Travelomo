import { serverFetcher } from "@/lib/serverFetcher";
import { IVendorEventDetails } from "@/types/event.types";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventForm } from "../../create-event/components/EventForm";

const fetchEvent = async (id: string) => {
	const response = await serverFetcher<IVendorEventDetails>(
		`/events/vendor-event/${id}`
	);
	return response;
};

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const event = await fetchEvent(id);

	return {
		title: `${event.title}`,
		description: event.description || "Edit your event details here.",
	};
}

export default async function EventEvent({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const event = await fetchEvent(id);

	if (!event) {
		notFound();
	}

	return (
		<>
			<h2 className="text-2xl font-medium mb-6">Edit Event</h2>
			<EventForm data={event} />;
		</>
	);
}
