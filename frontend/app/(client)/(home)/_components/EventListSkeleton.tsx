import EventCardSkeleton from "../../_components/EventCardSkeleton";

const EventListSkeleton = () => {
	return (
		<div className="grid grild-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{[...Array(4).keys()].map((i) => (
				<EventCardSkeleton key={i} />
			))}
		</div>
	);
};

export default EventListSkeleton;
