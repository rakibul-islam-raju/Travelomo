import Slider from "@/app/(client)/(home)/_components/Slider";
import EventCard from "@/app/(client)/_components/EventCard";
import Section from "@/app/(client)/_components/Section";
import { events } from "@/data/events";

export default function Home() {
	return (
		<>
			<Slider />

			<Section title="Featured Events">
				<div className="grid grild-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{events.slice(0, 8).map((event) => (
						<EventCard key={event.title} {...event} />
					))}
				</div>
			</Section>

			<Section title="Upcoming Events">
				<div className="grid grild-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{events.slice(0, 8).map((event) => (
						<EventCard key={event.title} {...event} />
					))}
				</div>
			</Section>
		</>
	);
}
