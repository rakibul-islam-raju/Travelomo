import { IEventListItem } from "@/models/Event";
import { GenericListResponse } from "@/types/common";
import EventCard from "../../_components/EventCard";

type Props = {
	initialEventsData?: GenericListResponse<IEventListItem>;
};

const EventList: React.FC<Props> = ({ initialEventsData }) => {
	return (
		<div className="grid grild-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{initialEventsData?.results?.map((event) => (
				<EventCard key={event.id} event={event} />
			))}
		</div>
	);
};

export default EventList;
