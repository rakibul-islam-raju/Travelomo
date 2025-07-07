import PlaceholderImage from "@/assets/images/event-details-placeholder.jpg";
import { BackButton } from "@/components/Buttons";
import { EventStatus } from "@/components/molecules/EventStatus";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { serverFetcher } from "@/lib/serverFetcher";
import { IVendorEventDetails } from "@/types/event.types";
import { formatDateDMonthY } from "@/utils/dateTimes";
import {
	CalendarDays,
	Copy,
	DollarSign,
	Edit2,
	MapPin,
	MoreVerticalIcon,
	Ticket,
	Trash2,
} from "lucide-react";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
	title: "Event Details",
};

const fetchEvent = async (id: string) => {
	const response = await serverFetcher<IVendorEventDetails>(
		`/events/vendor-event/${id}`
	);
	return response;
};

export default async function EventDetails({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const event = await fetchEvent(id);

	const hasDiscount =
		event.discount_price && event.discount_price < event.actual_price;
	const eventImage = event.image || PlaceholderImage;

	return (
		<>
			<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 flex-wrap">
				<div className="flex flex-col sm:flex-row items-start gap-3 flex-wrap">
					<BackButton href="/dashboard/events" />
					<div>
						<h2 className="text-2xl sm:text-3xl font-semibold">
							{event.title}
						</h2>
						<p className="text-muted-foreground text-sm">
							Created at: {formatDateDMonthY(event.created_at)}
						</p>

						{/* Badges */}
						<div className="mt-2 flex flex-wrap gap-2 text-xs">
							<EventStatus status={event.status} />
							{event.is_featured && (
								<span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
									🌟 Featured
								</span>
							)}
							{event.is_archived && (
								<span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">
									Archived
								</span>
							)}
						</div>
					</div>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="sm">
							<MoreVerticalIcon className="w-4 h-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="w-56" align="end">
						<DropdownMenuItem>
							<Copy className="mr-2 h-4 w-4" /> Duplicate
						</DropdownMenuItem>
						<DropdownMenuItem>
							<Edit2 className="mr-2 h-4 w-4" /> Edit
						</DropdownMenuItem>
						<DropdownMenuItem>
							<Trash2 className="mr-2 h-4 w-4" /> Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Banner image */}
			<div className="mt-6">
				<div className="relative w-full h-[250px] sm:h-[400px] md:h-[500px] rounded-lg overflow-hidden border">
					<Image
						src={eventImage}
						alt={event.title}
						fill
						className="object-cover object-center"
					/>
				</div>

				{/* Event info section */}
				<div className="grid sm:grid-cols-2 gap-6 mt-6 text-sm text-muted-foreground">
					<div className="flex flex-col gap-2">
						<div className="flex items-center gap-2">
							<CalendarDays size={16} />
							<span>Start: {formatDateDMonthY(event.start_date)}</span>
						</div>
						<div className="flex items-center gap-2">
							<CalendarDays size={16} />
							<span>End: {formatDateDMonthY(event.end_date)}</span>
						</div>
						<div className="flex items-center gap-2">
							<MapPin size={16} />
							<span>Location: {event.location}</span>
						</div>
					</div>

					<div className="flex flex-col gap-2">
						<div className="flex items-center gap-2">
							<Ticket size={16} />
							<span>
								Seats: {event.total_seats - event.available_seats}/
								{event.total_seats} booked
							</span>
						</div>
						<div className="flex items-center gap-2">
							<DollarSign size={16} />
							{hasDiscount ? (
								<span>
									<span className="line-through mr-2 text-destructive">
										৳{event.actual_price}
									</span>
									<span className="text-green-600 font-medium">
										৳{event.discount_price}
									</span>
								</span>
							) : (
								<span>Price: ৳{event.actual_price}</span>
							)}
						</div>
					</div>
				</div>

				{/* Description */}
				<div className="mt-10 prose prose-sm sm:prose max-w-none">
					<div dangerouslySetInnerHTML={{ __html: event.description }} />
				</div>
			</div>
		</>
	);
}
