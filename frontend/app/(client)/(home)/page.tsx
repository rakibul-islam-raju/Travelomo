import Slider from "@/app/(client)/(home)/_components/Slider";
import EventCard from "@/app/(client)/_components/EventCard";
import Section from "@/app/(client)/_components/Section";
import { eventService } from "@/services/eventService";
import SearchForm from "./_components/SearchForm";

export default async function Home() {
	const featuredEvents = await eventService.fetchFeaturedEvents();
	const events = await eventService.fetchEvents(8, 0);

	return (
		<>
			<section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 items-center gap-12 my-12">
				<div className="col-span-1 xl:col-span-2 text-center">
					<h6 className="text-lg font-semibold text-muted-foreground mb-2 uppercase tracking-widest">
						Choose the best destinaton
					</h6>
					<h2 className="text-3xl md:text-4xl mb-12 text-primary font-semibold">
						Plan Your Next Trip Now
					</h2>

					<SearchForm />
				</div>
				<div className="col-span-1">
					<Slider />
				</div>
			</section>

			<Section title="Featured Events">
				<div className="grid grild-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{featuredEvents?.results?.map((event) => (
						<EventCard key={event.id} event={event} />
					))}
				</div>
			</Section>

			<Section title="Upcoming Events">
				<div className="grid grild-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{events?.results?.map((event) => (
						<EventCard key={event.id} event={event} />
					))}
				</div>
			</Section>
		</>
	);
}
