import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import FilterBox from "@components/FilterBox";
import SearchInput from "@components/Inputs/SearchInput";
import { RESULT_PER_PAGE } from "@config/index";
import { useQueryParams } from "@hooks/useQueryParams";
import useSearch from "@hooks/useSearch";
import { useGetEventsQuery } from "@redux/event/eventApi";
import { formatDate, formatPostDate } from "@utils/dateUtils";
import {
	Button,
	DatePicker,
	Divider,
	Form,
	Image,
	Select,
	Space,
	Table,
	Typography,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const initialDateRange = {
	startDate: dayjs().subtract(1, "month"),
	endDate: dayjs().add(2, "month"),
};

const EventList = () => {
	const navigate = useNavigate();

	const { qParams, updateParams } = useQueryParams({
		limit: RESULT_PER_PAGE,
		offset: 0,
		search: "",
		is_archived: false,
		is_deleted: false,
	});
	const { searchText, onChange } = useSearch(null, updateParams);

	const { data: vendors, isLoading, refetch } = useGetEventsQuery(qParams);

	const [startDate, setStartDate] = useState(initialDateRange.startDate);
	const [endDate, setendDate] = useState(initialDateRange.endDate);
	const [page, setPage] = useState(1);

	const columns = [
		{
			title: "Image",
			dataIndex: "image",
			key: "image",
			render: (image, record) => (
				<Image
					src={image ? image : `https://placehold.co/100x100`}
					alt={record?.title}
					width={50}
					height={50}
				/>
			),
		},
		{
			title: "Title",
			dataIndex: "title",
			key: "title",
		},
		{
			title: "Price",
			dataIndex: "price",
			key: "price",
			render: (price, record) => (
				<>
					{record?.discount_price && <del>${record?.actual_price}</del>} $
					{price}
				</>
			),
		},
		{
			title: "Location",
			dataIndex: "location",
			key: "location",
		},
		{
			title: "Start Date",
			dataIndex: "start_date",
			key: "start_date",
			render: (start_date) => formatDate(start_date),
		},
		{
			title: "End Date",
			dataIndex: "end_date",
			key: "end_date",
			render: (end_date) => formatDate(end_date),
		},
		{
			title: "Created At",
			dataIndex: "created_at",
			key: "created_at",
			render: (created_at) => formatDate(created_at),
		},
		{
			title: "Vendor",
			dataIndex: ["vendor", "store_name"],
			key: "vendor",
			render: (store_name, record) => (
				<Link to={`/vendors/${record.vendor.id}`}>{store_name}</Link>
			),
		},
		{
			title: "Complted",
			dataIndex: "is_completed",
			key: "is_completed",
			render: (is_completed) =>
				is_completed ? (
					<CheckCircleOutlined style={{ color: "green" }} />
				) : (
					<CloseCircleOutlined style={{ color: "red" }} />
				),
		},
		{
			title: "Archived",
			dataIndex: "is_archived",
			key: "is_archived",
			render: (is_archived) =>
				is_archived ? (
					<CheckCircleOutlined style={{ color: "green" }} />
				) : (
					<CloseCircleOutlined style={{ color: "red" }} />
				),
		},
		{
			title: "Deleted",
			dataIndex: "is_deleted",
			key: "is_deleted",
			render: (is_deleted) =>
				is_deleted ? (
					<CheckCircleOutlined style={{ color: "green" }} />
				) : (
					<CloseCircleOutlined style={{ color: "red" }} />
				),
		},
		{
			title: "Action",
			dataIndex: "action",
			key: "action",
			render: (_, record) => (
				<Space direction="horizontal">
					<Button
						type="link"
						size="small"
						onClick={() => navigate(`/vendors/${record.id}`)}
					>
						View
					</Button>
				</Space>
			),
		},
	];

	// TODO: add vendor filter

	return (
		<>
			<Typography.Title level={2}>Vendor List</Typography.Title>
			<Divider />

			<FilterBox refresh={refetch}>
				<Form.Item label="Search">
					<SearchInput value={searchText} onChange={onChange} />
				</Form.Item>
				<Form.Item label="Start Date">
					<DatePicker
						format={"DD MMM, YYYY"}
						style={{ width: 200 }}
						placeholder="End Date"
						value={startDate}
						onChange={(value) => {
							setStartDate(value);
							updateParams({ start_date: formatPostDate(value) });
						}}
					/>
				</Form.Item>
				<Form.Item label="End Date">
					<DatePicker
						format={"DD MMM, YYYY"}
						style={{ width: 200 }}
						placeholder="Start Date"
						value={endDate}
						onChange={(value) => {
							setendDate(value);
							updateParams({ end_date: formatPostDate(value) });
						}}
					/>
				</Form.Item>
				<Form.Item label="Archive Status">
					<Select
						style={{ width: 200 }}
						value={qParams.is_archived}
						onChange={(value) => updateParams({ is_archived: value })}
						label="Archive Status"
						placeholder="Select Archive Status"
						options={[
							{ value: true, label: "Archived" },
							{ value: false, label: "Not Archived" },
						]}
					/>
				</Form.Item>
				<Form.Item label="Delete Status">
					<Select
						style={{ width: 200 }}
						value={qParams.is_deleted}
						onChange={(value) => updateParams({ is_deleted: value })}
						label="Delete Status"
						placeholder="Select Delete Status"
						options={[
							{ value: true, label: "Deleted" },
							{ value: false, label: "Not Deleted" },
						]}
					/>
				</Form.Item>
				<Form.Item label="Complete Status">
					<Select
						style={{ width: 200 }}
						value={qParams.is_completed}
						onChange={(value) => updateParams({ is_completed: value })}
						label="Complete Status"
						placeholder="Select Complete Status"
						options={[
							{ value: true, label: "Completed" },
							{ value: false, label: "Not Completed" },
						]}
					/>
				</Form.Item>
			</FilterBox>

			<Table
				size="small"
				columns={columns}
				dataSource={vendors?.results}
				loading={isLoading}
				rowKey={(row) => row.id}
				pagination={{
					total: vendors?.total,
					pageSize: RESULT_PER_PAGE,
					current: page,
					onChange: (page) => {
						setPage(page);
					},
				}}
				scroll={{ x: "max-content" }}
			/>
		</>
	);
};

export default EventList;
