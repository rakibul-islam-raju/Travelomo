import { useParams } from "react-router-dom";

const EventDetails = () => {
	const { eventId } = useParams();

	return <div>EventDetails - {eventId}</div>;
};

export default EventDetails;
