import Divider from "@/components/Divider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";
import { serverFetcher } from "@/lib/serverFetcher";
import { IEvent } from "@/models/Event";
import {
	Calendar,
	ChevronLeft,
	MapPin,
	MoveRight,
	Store,
	Tag,
	Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BookingSidebar from "./_components/BookingSidebar";

type Props = {
	params: Promise<{ eventId: string; eventSlug: string }>;
};

async function getEvent(eventId: string): Promise<IEvent | null> {
	try {
		return await serverFetcher<IEvent>(`/events/${eventId}/`);
	} catch {
		return null;
	}
}

export default async function EventDetailsPage({ params }: Props) {
	const { eventId } = await params;
	const event = await getEvent(eventId);

	if (!event) {
		notFound();
	}

	const tags = event.tags
		? event.tags.split(",").map((t) => t.trim()).filter(Boolean)
		: [];

	const hasDiscount =
		event.discount_price &&
		Number(event.discount_price) > 0 &&
		Number(event.discount_price) < Number(event.actual_price);

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
			{/* Left - Event Info */}
			<div className="lg:col-span-2 space-y-6">
				{/* Back + Title */}
				<div>
					<Link href="/events">
						<Button
							variant="ghost"
							size="sm"
							className="text-muted-foreground mb-3"
						>
							<ChevronLeft className="w-4 h-4 mr-1" />
							Back to Events
						</Button>
					</Link>
					<h1 className="text-2xl md:text-3xl font-bold">{event.title}</h1>

					{/* Vendor */}
					<div className="flex items-center gap-2 mt-2 text-muted-foreground">
						<Store className="w-4 h-4" />
						<span className="text-sm">
							Organized by{" "}
							<span className="font-medium text-foreground">
								{event.vendor.store_name}
							</span>
						</span>
					</div>
				</div>

				{/* Image */}
				<div className="relative h-[300px] md:h-[450px] w-full rounded-xl overflow-hidden">
					<Image
						src={
							event.image ||
							`https://picsum.photos/800/450?event=${event.id}`
						}
						alt={event.title}
						fill
						className="object-cover"
						priority
					/>
					{event.is_featured && (
						<Badge className="absolute top-4 left-4">Featured</Badge>
					)}
				</div>

				{/* Tags */}
				{tags.length > 0 && (
					<div className="flex items-center gap-2 flex-wrap">
						<Tag className="w-4 h-4 text-muted-foreground" />
						{tags.map((tag) => (
							<Badge key={tag} variant="secondary">
								{tag}
							</Badge>
						))}
					</div>
				)}

				<Divider />

				{/* Description */}
				<div>
					<h2 className="text-xl font-semibold mb-3">About This Event</h2>
					<div
						className="prose prose-sm max-w-none text-muted-foreground"
						dangerouslySetInnerHTML={{ __html: event.description }}
					/>
				</div>
			</div>

			{/* Right - Booking Sidebar */}
			<div className="lg:col-span-1">
				<div className="sticky top-24 space-y-6">
					{/* Price Card */}
					<div className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
						<div>
							<p className="text-sm text-muted-foreground mb-1">
								Price per seat
							</p>
							<div className="flex items-baseline gap-2">
								{hasDiscount ? (
									<>
										<span className="text-3xl font-bold text-primary">
											${event.discount_price}
										</span>
										<span className="text-lg text-muted-foreground line-through">
											${event.actual_price}
										</span>
									</>
								) : (
									<span className="text-3xl font-bold text-primary">
										${event.actual_price}
									</span>
								)}
							</div>
						</div>

						<Divider />

						{/* Date */}
						<div className="flex items-start gap-3">
							<Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
							<div>
								<p className="text-sm font-medium">Date</p>
								<p className="text-sm text-muted-foreground">
									{formatDate(event.start_date)}
									<MoveRight className="inline w-4 h-4 mx-1" />
									{formatDate(event.end_date)}
								</p>
							</div>
						</div>

						{/* Location */}
						<div className="flex items-start gap-3">
							<MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
							<div>
								<p className="text-sm font-medium">Location</p>
								<p className="text-sm text-muted-foreground">
									{event.location}
								</p>
							</div>
						</div>

						{/* Seats */}
						<div className="flex items-start gap-3">
							<Users className="w-5 h-5 text-muted-foreground mt-0.5" />
							<div>
								<p className="text-sm font-medium">Availability</p>
								<p className="text-sm text-muted-foreground">
									{event.available_seats} of {event.total_seats} seats available
								</p>
							</div>
						</div>

						<Divider />

						{/* Seat Progress */}
						<div>
							<div className="flex justify-between text-sm mb-1">
								<span className="text-muted-foreground">Seats booked</span>
								<span className="font-medium">
									{event.seat_booked}/{event.total_seats}
								</span>
							</div>
							<div className="w-full bg-muted rounded-full h-2">
								<div
									className="bg-primary rounded-full h-2 transition-all"
									style={{
										width: `${
											event.total_seats > 0
												? (event.seat_booked / event.total_seats) * 100
												: 0
										}%`,
									}}
								/>
							</div>
						</div>

						{/* Book Button */}
						<BookingSidebar
							eventId={event.id}
							availableSeats={event.available_seats}
							price={event.price}
							cancellationDays={event.cancellation_days ?? 0}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
