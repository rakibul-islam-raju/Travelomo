import { useGetEventDetailsQuery } from "@redux/event/eventApi";
import { formatDate } from "@utils/dateUtils";
import {
	Button,
	Card,
	Descriptions,
	Divider,
	Flex,
	Image,
	Result,
	Skeleton,
	Space,
	Statistic,
	Table,
	Tag,
	Typography,
} from "antd";
import { IoMdArrowRoundBack } from "react-icons/io";
import { Link, useNavigate, useParams } from "react-router-dom";

const STATUS_TAGS = {
	draft: { color: "default", label: "Draft" },
	published: { color: "green", label: "Published" },
	paused: { color: "orange", label: "Paused" },
	travelling: { color: "blue", label: "Travelling" },
	cancelled: { color: "red", label: "Cancelled" },
	completed: { color: "purple", label: "Completed" },
};

const formatMoney = (amount, currency = "BDT") =>
	`${currency} ${Number(amount ?? 0).toLocaleString()}`;

const bookingColumns = (currency) => [
	{ title: "Status", dataIndex: "label", key: "label" },
	{ title: "Bookings", dataIndex: "bookings", key: "bookings", align: "right" },
	{ title: "Seats", dataIndex: "seats", key: "seats", align: "right" },
	{
		title: "Amount",
		dataIndex: "amount",
		key: "amount",
		align: "right",
		render: (amount) => formatMoney(amount, currency),
	},
];

const EventDetails = () => {
	const navigate = useNavigate();
	const { eventId } = useParams();

	const {
		data: event,
		isLoading,
		error,
		refetch,
	} = useGetEventDetailsQuery(eventId, { skip: !eventId });

	const backButton = (
		<Button onClick={() => navigate(-1)} icon={<IoMdArrowRoundBack />} />
	);

	if (isLoading) {
		return <Skeleton active paragraph={{ rows: 10 }} />;
	}

	if (error || !event) {
		const notFound = error?.status === 404;
		return (
			<Result
				status={notFound ? "404" : "error"}
				title={notFound ? "Event not found" : "Could not load this event"}
				subTitle={notFound ? undefined : error?.data}
				extra={
					<Space>
						{backButton}
						{!notFound && <Button onClick={refetch}>Retry</Button>}
					</Space>
				}
			/>
		);
	}

	const status = STATUS_TAGS[event.status] ?? {
		color: "default",
		label: event.status,
	};
	const { vendor, booking_summary: summary } = event;

	return (
		<>
			<Flex justify="space-between" align="center" wrap gap={8}>
				<Space align="center" wrap>
					{backButton}
					<Typography.Title level={2} className="mb-0">
						{event.title}
					</Typography.Title>
					<Tag color={status.color}>{status.label}</Tag>
					{event.is_archived && <Tag color="volcano">Archived</Tag>}
					{event.is_featured && <Tag color="gold">Featured</Tag>}
				</Space>
			</Flex>
			<Divider />

			<Flex vertical gap={16}>
				<Card title="Event">
					<Flex gap={24} wrap>
						{event.image && (
							<Image src={event.image} alt={event.title} width={200} />
						)}
						<Descriptions
							column={{ xs: 1, md: 2 }}
							style={{ flex: 1, minWidth: 280 }}
						>
							<Descriptions.Item label="Location">
								{event.location}
							</Descriptions.Item>
							<Descriptions.Item label="Start Date">
								{formatDate(event.start_date)}
							</Descriptions.Item>
							<Descriptions.Item label="End Date">
								{formatDate(event.end_date)}
							</Descriptions.Item>
							<Descriptions.Item label="Cancellation">
								{event.cancellation_days
									? `Up to ${event.cancellation_days} day(s) before start`
									: "Not allowed after confirmation"}
							</Descriptions.Item>
							<Descriptions.Item label="Tags">
								{event.tags || "-"}
							</Descriptions.Item>
							<Descriptions.Item label="Created At">
								{formatDate(event.created_at)}
							</Descriptions.Item>
							<Descriptions.Item label="Updated At">
								{formatDate(event.updated_at)}
							</Descriptions.Item>
						</Descriptions>
					</Flex>
				</Card>

				<Card title="Vendor">
					<Descriptions column={{ xs: 1, md: 2 }}>
						<Descriptions.Item label="Store">
							<Link to={`/vendors/${vendor.id}`}>{vendor.store_name}</Link>
						</Descriptions.Item>
						<Descriptions.Item label="Approval">
							{vendor.is_approved ? (
								<Tag color="green">Approved</Tag>
							) : (
								<Tag color="red">Not approved</Tag>
							)}
						</Descriptions.Item>
						<Descriptions.Item label="Owner Email">
							{vendor.owner_email}
						</Descriptions.Item>
						<Descriptions.Item label="Store Email">
							{vendor.store_email || "-"}
						</Descriptions.Item>
						<Descriptions.Item label="Store Phone">
							{vendor.store_phone || "-"}
						</Descriptions.Item>
					</Descriptions>
				</Card>

				<Card title="Price & Capacity">
					<Descriptions column={{ xs: 1, md: 3 }}>
						<Descriptions.Item label="Customer Price">
							{formatMoney(event.price, summary.currency)}
						</Descriptions.Item>
						<Descriptions.Item label="Actual Price">
							{formatMoney(event.actual_price, summary.currency)}
						</Descriptions.Item>
						<Descriptions.Item label="Discount Price">
							{event.discount_price
								? formatMoney(event.discount_price, summary.currency)
								: "-"}
						</Descriptions.Item>
						<Descriptions.Item label="Total Seats">
							{event.total_seats}
						</Descriptions.Item>
						<Descriptions.Item label="Available Seats">
							{event.available_seats}
						</Descriptions.Item>
						<Descriptions.Item label="Seats Held">
							{event.seat_booked}
						</Descriptions.Item>
					</Descriptions>
				</Card>

				<Card title="Bookings">
					<Flex gap={48} wrap style={{ marginBottom: 16 }}>
						<Statistic title="Total Bookings" value={summary.total_bookings} />
						<Statistic
							title="Verified Booking Value"
							value={formatMoney(
								summary.verified_booking_value,
								summary.currency
							)}
						/>
					</Flex>
					<Table
						size="small"
						columns={bookingColumns(summary.currency)}
						dataSource={summary.statuses}
						rowKey="status"
						pagination={false}
						scroll={{ x: "max-content" }}
					/>
				</Card>
			</Flex>
		</>
	);
};

export default EventDetails;
