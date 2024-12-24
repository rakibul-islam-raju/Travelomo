import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import FilterBox from "@components/FilterBox";
import SearchInput from "@components/Inputs/SearchInput";
import { RESULT_PER_PAGE } from "@config/index";
import { useQueryParams } from "@hooks/useQueryParams";
import useSearch from "@hooks/useSearch";
import { useGetUsersQuery } from "@redux/user/userApi";
import {
	Avatar,
	Button,
	Divider,
	Image,
	Select,
	Space,
	Table,
	Typography,
} from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const UserList = () => {
	const navigate = useNavigate();

	const { qParams, updateParams } = useQueryParams({
		limit: RESULT_PER_PAGE,
		offset: 0,
		search: "",
		is_active: null,
	});
	const { searchText, onChange } = useSearch(null, updateParams);

	const { data, isLoading, refetch } = useGetUsersQuery(qParams);

	const [page, setPage] = useState(1);

	const handleChangeActiveStatus = (value) => {
		if (value === "all") {
			updateParams({ is_active: "" });
		} else {
			updateParams({ is_active: value });
		}
	};

	const handleSelectRole = (value) => {
		if (value === "") {
			updateParams({ role: "" });
		} else {
			updateParams({ role: value });
		}
	};

	const columns = [
		{
			title: "First Name",
			dataIndex: "first_name",
			key: "first_name",
			render: (first_name, record) => (
				<Space>
					{record.logo ? (
						<Image src={record.logo} alt="logo" width={35} height={35} />
					) : (
						<Avatar alt="logo" size={35}>
							{first_name[0]}
						</Avatar>
					)}
					<Typography.Text>{first_name}</Typography.Text>
				</Space>
			),
		},
		{
			title: "Last Name",
			dataIndex: ["last_name"],
			key: "last_name",
		},
		{
			title: "Email",
			dataIndex: ["email"],
			key: "email",
		},
		{
			title: "Phone Number",
			dataIndex: ["profile", "phone_number"],
			key: "phone_number",
		},
		{
			title: "Active",
			dataIndex: ["is_active"],
			key: "is_active",
			render: (is_active) =>
				is_active ? (
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
						onClick={() => navigate(`/users/${record.id}`)}
					>
						View
					</Button>
				</Space>
			),
		},
	];

	return (
		<div>
			<Typography.Title level={2}>Users</Typography.Title>

			<Divider />

			<FilterBox refresh={refetch}>
				<SearchInput value={searchText} onChange={onChange} />
				<Select
					style={{ width: 200 }}
					value={qParams.is_active}
					onChange={handleChangeActiveStatus}
					label="Active Status"
					placeholder="Select Active Status"
					options={[
						{ value: "", label: "Select Active Status" },
						{ value: true, label: "Active" },
						{ value: false, label: "Inactive" },
					]}
				/>
				<Select
					style={{ width: 200 }}
					value={qParams.role}
					onChange={handleSelectRole}
					label="User Role"
					placeholder="Select User Role"
					options={[
						{ value: "", label: "Select User Role" },
						{ value: "vendor", label: "Vendor" },
						{ value: "customer", label: "Customer" },
					]}
				/>
			</FilterBox>

			<Table
				size="small"
				columns={columns}
				dataSource={data?.results}
				loading={isLoading}
				rowKey={(row) => row.id}
				pagination={{
					total: data?.total,
					pageSize: RESULT_PER_PAGE,
					current: page,
					onChange: (page) => {
						setPage(page);
					},
				}}
				scroll={{ x: "max-content" }}
			/>
		</div>
	);
};

export default UserList;
