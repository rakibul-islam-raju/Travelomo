import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import FilterBox from "@components/FilterBox";
import SearchInput from "@components/Inputs/SearchInput";
import { RESULT_PER_PAGE } from "@config/index";
import { useQueryParams } from "@hooks/useQueryParams";
import {
	useApproveVendorMutation,
	useGetVendorsQuery,
} from "@redux/vendor/vendorApi";
import {
	Avatar,
	Button,
	Divider,
	Image,
	message,
	Popconfirm,
	Select,
	Space,
	Table,
	Typography,
} from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const VendorList = () => {
	const navigate = useNavigate();

	const { qParams, updateParams } = useQueryParams({
		limit: RESULT_PER_PAGE,
		offset: 0,
		search: "",
		is_approved: "",
	});

	const { data: vendors, isLoading } = useGetVendorsQuery(qParams);
	const [approveVendor, { isLoading: isApproving }] =
		useApproveVendorMutation();

	const handleApproveVendor = async (vendorId) => {
		await approveVendor({ id: vendorId, data: { is_approved: true } }).unwrap();
		message.success("Vendor approved successfully");
	};

	const handleChangeApproveStatus = (value) => {
		if (value === "all") {
			updateParams({ is_approved: "" });
		} else {
			updateParams({ is_approved: value });
		}
	};

	const [page, setPage] = useState(1);

	const columns = [
		{
			title: "Store Name",
			dataIndex: "store_name",
			key: "store_name",
			render: (store_name, record) => (
				<Space>
					{record.logo ? (
						<Image src={record.logo} alt="logo" width={35} height={35} />
					) : (
						<Avatar alt="logo" size={35}>
							{record.store_name[0]}
						</Avatar>
					)}
					<Typography.Text>{store_name}</Typography.Text>
				</Space>
			),
		},
		{
			title: "Phone Number",
			dataIndex: "store_phone",
			key: "store_phone",
		},
		{
			title: "Approval",
			dataIndex: "is_approved",
			key: "is_approved",
			render: (is_approved) =>
				is_approved ? (
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
					<Popconfirm
						title="Approve the vendor"
						description="Are you sure to approve this vendor?"
						onConfirm={() => handleApproveVendor(record.id)}
						okText="Approve"
						cancelText="Cancel"
						placement="topRight"
					>
						<Button
							type="link"
							size="small"
							disabled={record.is_approved || isApproving}
							loading={isApproving}
						>
							{record.is_approved ? "Approved" : "Approve"}
						</Button>
					</Popconfirm>
				</Space>
			),
		},
	];

	return (
		<>
			<Typography.Title level={2}>Vendor List</Typography.Title>
			<Divider />

			<FilterBox>
				<SearchInput />
				<Select
					size="large"
					style={{ width: 200 }}
					value={qParams.is_approved}
					onChange={handleChangeApproveStatus}
					label="Approve Status"
					placeholder="Select approve status"
					options={[
						{ value: "", label: "Approve Status" },
						{ value: true, label: "Approved" },
						{ value: false, label: "Pending" },
					]}
				/>
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
			/>
		</>
	);
};

export default VendorList;
