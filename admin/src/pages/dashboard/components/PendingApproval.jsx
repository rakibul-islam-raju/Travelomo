import {
	CheckCircleOutlined,
	CloseCircleOutlined,
	ReloadOutlined,
} from "@ant-design/icons";
import { useQueryParams } from "@hooks/useQueryParams";
import {
	useApproveVendorMutation,
	useGetVendorsQuery,
} from "@redux/vendor/vendorApi";
import {
	Avatar,
	Button,
	Card,
	Divider,
	Image,
	Popconfirm,
	Space,
	Table,
	Typography,
	message,
} from "antd";
import { useNavigate } from "react-router-dom";

const PendingApproval = () => {
	const navigate = useNavigate();

	const { qParams } = useQueryParams({
		limit: 5,
		offset: 0,
		is_approved: false,
	});

	const { data: vendors, isLoading, refetch } = useGetVendorsQuery(qParams);
	const [approveVendor, { isLoading: isApproving }] =
		useApproveVendorMutation();

	const handleApproveVendor = async (vendorId) => {
		await approveVendor({ id: vendorId, data: { is_approved: true } }).unwrap();
		message.success("Vendor approved successfully");
	};

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
		<Card
			size="small"
			title="Pending Vendors"
			extra={
				<Space split={<Divider type="vertical" />}>
					<Button
						size="small"
						type="link"
						icon={<ReloadOutlined />}
						title="Refresh"
						onClick={refetch}
					/>
					<Button size="small" type="link" onClick={() => navigate("/vendors")}>
						View All
					</Button>
				</Space>
			}
		>
			<Table
				columns={columns}
				dataSource={vendors?.results}
				pagination={false}
				loading={isLoading}
				scroll={{ x: "max-content" }}
			/>

			{/* Add any other components or logic here */}
		</Card>
	);
};

export default PendingApproval;
