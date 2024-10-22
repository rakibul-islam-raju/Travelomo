import Slider from "@/app/(client)/(home)/_components/Slider";
import EventCard from "@/app/(client)/_components/EventCard";
import Section from "@/app/(client)/_components/Section";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { events } from "@/data/events";
import { Search } from "lucide-react";

export default function Home() {
	return (
		<>
			<section className="grid grid-cols-1 md:grid-cols-2 items-center gap-12 my-12">
				<div className="col-span-1">
					<h2 className="text-3xl mb-12 text-center">
						Find Your Next Tour Event
					</h2>

					<div className="flex items-center relative mb-6">
						<Search className="text-muted-foreground absolute left-2" />
						<Input
							placeholder="Search for a tour event"
							className="w-full pl-10"
						/>
					</div>

					<div className="flex items-center gap-4">
						<div className="shadow p-4 rounded space-y-2 w-full">
							<span>Tour Date</span>
							<DateRangePicker />
						</div>
						<div className="shadow p-4 rounded space-y-2 w-full">
							<span>Number of Seat</span>
							<Input type="number" min={1} />
						</div>
					</div>
					<div className="flex justify-center mt-8">
						<Button className="w-full">Search</Button>
					</div>
				</div>

				<div className="col-span-1">
					<Slider />
				</div>
			</section>

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
