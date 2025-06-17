import Slider from "@/app/(client)/(home)/_components/Slider";
import CTA from "@/components/CTA";
import { serverFetcher } from "@/lib/serverFetcher";
import { IEventListItem } from "@/models/Event";
import { GenericListResponse } from "@/types/common";
import { Suspense } from "react";
import EventCard from "../_components/EventCard";
import Section from "../_components/Section";
import EventList from "./_components/EventList";
import EventListSkeleton from "./_components/EventListSkeleton";
import SearchForm from "./_components/SearchForm";
import ViewAllBtn from "./_components/ViewAllBtn";

export const dynamic = "force-dynamic";

export const fetchEvents = async () => {
	const limit = 8;
	const response = await serverFetcher<GenericListResponse<IEventListItem>>(
		`/events?limit=${limit}`,
		{
			method: "GET",
			revalidate: 0,
		}
	);
	return response;
};

export default async function Home() {
	const events = await fetchEvents();

	return (
		<>
			<section className="relative bg-white rounded-3xl shadow-lg p-4 sm:p-6 md:p-8 lg:p-12 my-6 sm:my-8 md:my-10 lg:my-12">
				<div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-8 lg:gap-16">
					<div className="">
						<div className="relative h-[450px] lg:h-[600px] w-full rounded-2xl overflow-hidden">
							<Slider />
							<div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
						</div>
					</div>

					<div className="space-y-6 text-center lg:text-left">
						<span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
							<span className="relative flex h-2 w-2">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
								<span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
							</span>
							Live Events Available
						</span>

						<div className="space-y-4">
							<h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
								Experience <span className="text-primary">Unforgettable</span>{" "}
								Moments
							</h1>
							<p className="text-gray-600 text-lg">
								Join thousands of adventure seekers and discover events that
								will create lasting memories
							</p>
						</div>

						<SearchForm />

						<div className="flex items-center justify-center lg:justify-start gap-8 pt-4">
							<div className="text-center">
								<p className="text-2xl font-bold text-primary">1000+</p>
								<p className="text-sm text-gray-600">Events</p>
							</div>
							<div className="h-12 w-px bg-gray-200"></div>
							<div className="text-center">
								<p className="text-2xl font-bold text-primary">50+</p>
								<p className="text-sm text-gray-600">Countries</p>
							</div>
							<div className="h-12 w-px bg-gray-200"></div>
							<div className="text-center">
								<p className="text-2xl font-bold text-primary">100k+</p>
								<p className="text-sm text-gray-600">Users</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<Section title="Featured Events" action={<ViewAllBtn />}>
				<Suspense fallback={<EventListSkeleton />}>
					<EventList initialEventsData={events} />
				</Suspense>
			</Section>

			<Section title="Ending Soon" action={<ViewAllBtn />}>
				<div className="grid grild-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{events?.results?.map((event) => (
						<EventCard key={event.id} event={event} />
					))}
				</div>
			</Section>

			<Section title="Limited Availability" action={<ViewAllBtn />}>
				<div className="grid grild-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{events?.results?.map((event) => (
						<EventCard key={event.id} event={event} />
					))}
				</div>
			</Section>

			<CTA
				title="Discover Your Dream Destination"
				description="Join us on an unforgettable journey and make your travel dreams come true"
				buttonText="Explore More"
			/>
		</>
	);
}
