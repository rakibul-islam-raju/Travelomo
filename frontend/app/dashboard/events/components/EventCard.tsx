import { EventStatus } from "@/components/molecules/EventStatus";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { IVendorEventListItem } from "@/types/event.types";
import { formatDateDMonthY } from "@/utils/dateTimes";
import { Calendar1, MapPin, MoveRight, Sofa } from "lucide-react";

type Props = {
	event: IVendorEventListItem;
};

export const EventCard: React.FC<Props> = ({ event }) => {
	return (
		<Card className="hover:shadow-md transition">
			<CardContent className="p-4">
				<h2 className="text-xl text-ellipsis mb-2">{event.title}</h2>

				<div className="text-sm space-y-1 text-foreground/80">
					<div className="flex gap-2 items-center flex-wrap ">
						<Calendar1 className="size-5" />
						<span>{formatDateDMonthY(event.start_date)}</span>
						<span>
							<MoveRight className="size-5" />
						</span>
						<span>{formatDateDMonthY(event.end_date)}</span>
					</div>

					<div className="">
						<div className="flex gap-2">
							<Sofa className="size-5" /> {event.available_seats} Seats
						</div>
					</div>

					<div className="">
						<div className="flex gap-2">
							<MapPin className="size-5" /> {event.location}
						</div>
					</div>

					<div className="flex justify-end flex-wrap gap-2">
						{event.is_featured && <Badge>Featured</Badge>}
						<EventStatus status={event.status} />
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
