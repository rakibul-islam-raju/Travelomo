import { Metadata } from "next";
import { EventForm } from "./components/EventForm";

export const metadata: Metadata = {
	title: "Create Event",
};

export default function CreateEvent() {
	return (
		<>
			<h2 className="text-2xl font-medium mb-6">Create New Event</h2>
			<EventForm />
		</>
	);
}
