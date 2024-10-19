import Slider from "@/components/home/Slider";
import Section from "@/components/Section";
import React from "react";
import { events } from "@/data/events";
import EventCard from "@/components/EventCard";

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
