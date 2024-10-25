import { formatDate } from "@/lib/dates";
import { EventListItem } from "@/types/event";
import { Armchair } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "../../../components/ui/button";

type Props = {
	event: EventListItem;
};

export default function EventCard({ event }: Props): React.ReactNode {
	return (
		<Link href={`/events/${event.id}/${event.slug}`}>
			<div className="rounded-lg overflow-hidden shadow group hover:shadow-md transition-all duration-300 cursor-pointer">
				<div className="relative h-[200px] overflow-hidden">
					<Image
						src={event.image || "https://via.placeholder.com/300"}
						alt={event.title}
						layout="fill"
						className=" w-full object-cover group-hover:scale-110 transition-all duration-300 h-[200px]"
					/>
				</div>
				<div className="p-4">
					<h2 className="text-lg font-semibold text-gray-800 mb-2 truncate">
						{event.title}
					</h2>
					<p className="text-sm text-muted-foreground">
						{formatDate(event.start_date)} - {formatDate(event.end_date)}
					</p>
					<div className="flex justify-between items-center mt-2">
						<div className="bg-primary/10 text-primary py-1 px-2 rounded-md text-sm font-semibold">
							{event.seat_available} seats available
						</div>
						<div className="bg-primary/10 text-primary py-1 px-2 rounded-md text-sm font-semibold">
							${event.price} per seat
						</div>
					</div>
					<Button className="w-full mt-4" variant={"default"}>
						<Armchair className="w-4 h-4 mr-2" />
						Book Now
					</Button>
				</div>
			</div>
		</Link>
	);
}
