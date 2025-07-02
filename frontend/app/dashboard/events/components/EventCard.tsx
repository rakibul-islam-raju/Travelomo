import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IVendorEventListItem } from "@/types/event.types";
import { formatDateDMonthY } from "@/utils/dateTimes";
import { Calendar1, MoreVertical, MoveRight, Sofa } from "lucide-react";

type Props = {
	event: IVendorEventListItem;
};

export const EventCard: React.FC<Props> = ({ event }) => {
	return (
		<Card className="hover:shadow-md transition">
			<CardContent className="p-4 space-y-2">
				<div className="flex text-xl font-medium justify-between flex-wrap items-start">
					<h2 className="text-xltext-ellipsis">{event.title}</h2>
					<Button type="button" variant={"ghost"} size={"icon"}>
						<MoreVertical />
					</Button>
				</div>

				<div className="flex gap-4 items-center flex-wrap text-sm">
					<Calendar1 />
					<span>{formatDateDMonthY(event.start_date)}</span>
					<span>
						<MoveRight />
					</span>
					<span>{formatDateDMonthY(event.end_date)}</span>
				</div>

				<div className="flex justify-between flex-wrap gap-6">
					<div className="flex gap-4">
						<Sofa /> {event.available_seats} Seats
					</div>
					<div className="flex gap-4">
						<Badge className="uppercase">{event.status}</Badge>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
