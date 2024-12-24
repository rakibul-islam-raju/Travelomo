import {
	CheckCircleOutlined,
	CloseCircleOutlined,
	PlusOutlined,
} from "@ant-design/icons";
import FilterBox from "@components/FilterBox";
import SearchInput from "@components/Inputs/SearchInput";
import { RESULT_PER_PAGE } from "@config/index";
import { useQueryParams } from "@hooks/useQueryParams";
import { useGetStaffsQuery } from "@redux/user/userApi";
import {
	Avatar,
	Button,
	Divider,
	Flex,
	Image,
	Select,
	Space,
	Table,
	Typography,
} from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AddStaffModal from "./components/AddStaffModal";
import useSearch from "@hooks/useSearch";

const StaffList = () => {
	const navigate = useNavigate();

	const { qParams, updateParams } = useQueryParams({
		limit: RESULT_PER_PAGE,
		offset: 0,
		search: "",
		is_active: null,
		is_superuser: null,
	});

	const { searchText, onChange } = useSearch(null, updateParams);

	const { data, isLoading, refetch } = useGetStaffsQuery(qParams);

	const [page, setPage] = useState(1);
	const [open, setOpen] = useState(false);

	const handleChangeActiveStatus = (value) => {
		if (value === "all") {
			updateParams({ is_active: "" });
		} else {
			updateParams({ is_active: value });
		}
	};

	const handleChangeSuperUserStatus = (value) => {
		if (value === "all") {
			updateParams({ is_superuser: "" });
		} else {
			updateParams({ is_superuser: value });
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
			title: "Phone Number",
			dataIndex: ["profile", "phone_number"],
			key: "phone_number",
		},
		{
			title: "Email",
			dataIndex: ["email"],
			key: "email",
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
			title: "Super User",
			dataIndex: ["is_superuser"],
			key: "is_superuser",
			render: (is_superuser) =>
				is_superuser ? (
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
						onClick={() => navigate(`/staffs/${record.id}`)}
					>
						View
					</Button>
				</Space>
			),
		},
	];

	return (
		<div>
			<Flex justify="space-between" align="center">
				<Typography.Title level={2} className="mb-0">
					Staffs
				</Typography.Title>
				<Button
					type="primary"
					icon={<PlusOutlined />}
					onClick={() => setOpen(true)}
				>
					Add Staff
				</Button>
			</Flex>

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
					value={qParams.is_superuser}
					onChange={handleChangeSuperUserStatus}
					label="Super User Status"
					placeholder="Select Super User Status"
					options={[
						{ value: "", label: "Select Super User Status" },
						{ value: true, label: "Super User" },
						{ value: false, label: "Staff User" },
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
					total: data?.count,
					pageSize: RESULT_PER_PAGE,
					current: page,
					onChange: (page) => {
						setPage(page);
					},
				}}
				scroll={{ x: "max-content" }}
			/>

			<AddStaffModal
				open={open}
				onClose={() => setOpen(false)}
				listArgs={qParams}
			/>
		</div>
	);
};

export default StaffList;
