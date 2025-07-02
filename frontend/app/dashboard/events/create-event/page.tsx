import { Metadata } from "next";
import { EventForm } from "./components/EventForm";

export const metadata: Metadata = {
	title: "Create Event",
};

export default function CreateEvent() {
	return (
		<>
			<EventForm />
		</>
	);
}
