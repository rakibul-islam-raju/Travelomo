import { MoreOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Divider, Dropdown, Space, Table, message } from "antd";

// Sample data for the table
const data = [
	{
		key: "1",
		name: "John Brown",
		age: 32,
		address: "New York No. 1 Lake Park",
	},
	{
		key: "2",
		name: "Jim Green",
		age: 42,
		address: "London No. 1 Lake Park",
	},
	{
		key: "3",
		name: "Joe Black",
		age: 32,
		address: "Sidney No. 1 Lake Park",
	},
];

const PendingApproval = () => {
	const handleApprove = (record) => {
		// Logic to approve the vendor
		message.success(`Approved vendor: ${record.name}`);
		// You would typically make an API call here to update the backend
	};

	const handleReject = (record) => {
		// Logic to reject the vendor
		message.error(`Rejected vendor: ${record.name}`);
		// You would typically make an API call here to update the backend
	};

	const columns = [
		{
			title: "Name",
			dataIndex: "name",
			key: "name",
		},
		{
			title: "Age",
			dataIndex: "age",
			key: "age",
		},
		{
			title: "Address",
			dataIndex: "address",
			key: "address",
		},

		{
			title: "Action",
			dataIndex: "action",
			key: "action",
			render: (_, record) => (
				<Dropdown
					menu={{
						items: [
							{
								key: "approve",
								label: "Approve",
								onClick: () => handleApprove(record),
							},
							{
								key: "reject",
								label: "Reject",
								danger: true,
								onClick: () => handleReject(record),
							},
						],
					}}
					placement="bottomRight"
				>
					<Button shape="circle" icon={<MoreOutlined />} size="small" />
				</Dropdown>
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
					/>
					<Button size="small" type="link">
						View All
					</Button>
				</Space>
			}
		>
			<Table columns={columns} dataSource={data} pagination={false} />
			{/* Add any other components or logic here */}
		</Card>
	);
};

export default PendingApproval;
