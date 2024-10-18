import { MoreOutlined } from "@ant-design/icons";
import AppConfirmModal from "@components/AppConfirmModal";
import { useGetStaffDetailsQuery } from "@redux/user/userApi";
import { Button, Divider, Dropdown, Flex, Space, Typography } from "antd";
import { useState } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useNavigate, useParams } from "react-router-dom";

const StaffDetail = () => {
	const navigate = useNavigate();
	const { staffId } = useParams();

	const { data: user } = useGetStaffDetailsQuery(staffId, {
		skip: !staffId,
	});

	const [isResetModalVisible, setIsResetModalVisible] = useState(false);
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

	const handleSendResetLink = () => {
		// setSendResetList(true);
	};

	const handleDeleteUser = () => {
		console.log("delete");
		setIsDeleteModalVisible(false);
	};

	return (
		<>
			<Flex justify="space-between" align="center">
				<Space>
					<Button onClick={() => navigate(-1)} icon={<IoMdArrowRoundBack />} />
					<Typography.Title
						level={2}
						className="mb-0"
					>{`${user?.first_name} ${user?.last_name}`}</Typography.Title>
				</Space>
				<Dropdown
					trigger={["click"]}
					menu={{
						items: [
							{
								// TODO: only super user can do this
								label: "Edit Staff",
								key: "edit-staff",
								onClick: () => setIsResetModalVisible(true),
							},
							{
								label: "Send Password Reset Link",
								key: "send-password-reset-link",
								onClick: () => setIsResetModalVisible(true),
							},
							{
								// TODO: only super user can do this
								label: "Deactivate Staff",
								key: "delete-staff",
								danger: true,
								onClick: () => setIsDeleteModalVisible(true),
							},
						],
					}}
				>
					<Button icon={<MoreOutlined />} />
				</Dropdown>
			</Flex>

			<Divider />

			<Flex vertical gap={2}>
				<Space>
					<Typography.Text strong>Email:</Typography.Text>
					<Typography.Text>{user?.email}</Typography.Text>
				</Space>
				<Space>
					<Typography.Text strong>Phone:</Typography.Text>
					<Typography.Text>
						{user?.profile?.phone_number ?? "-"}
					</Typography.Text>
				</Space>
			</Flex>

			<AppConfirmModal
				title={
					isDeleteModalVisible ? "Disable Staff" : "Send Password Reset Link"
				}
				description={
					isDeleteModalVisible
						? "Are you sure you want to deactivate this staff?"
						: "Are you sure you want to send a password reset link to this staff?"
				}
				open={isDeleteModalVisible || isResetModalVisible}
				onCancel={() => {
					setIsDeleteModalVisible(false);
					setIsResetModalVisible(false);
				}}
				onOk={isDeleteModalVisible ? handleDeleteUser : handleSendResetLink}
				deleteConfirm={isDeleteModalVisible}
			/>
		</>
	);
};

export default StaffDetail;
