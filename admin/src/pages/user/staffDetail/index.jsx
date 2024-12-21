import { MoreOutlined } from "@ant-design/icons";
import AppConfirmModal from "@components/AppConfirmModal";
import useAuthUser from "@hooks/useAuthUser";
import {
	useDeactivateUserMutation,
	useGetStaffDetailsQuery,
} from "@redux/user/userApi";
import { isSuperUser } from "@utils/permissions";
import { Button, Divider, Dropdown, Flex, Space, Typography } from "antd";
import { useState } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useNavigate, useParams } from "react-router-dom";

const StaffDetail = () => {
	const navigate = useNavigate();
	const { staffId } = useParams();
	const user = useAuthUser();

	const { data: userData } = useGetStaffDetailsQuery(staffId, {
		skip: !staffId,
	});
	const [deactivateUser] = useDeactivateUserMutation();

	const [isResetModalVisible, setIsResetModalVisible] = useState(false);
	const [isDisableModalVisible, setIsDisableModalVisible] = useState(false);

	const handleSendResetLink = () => {
		// setSendResetList(true);
	};

	const handleDisableUser = async () => {
		await deactivateUser({
			id: userData?.id,
			data: { is_active: !userData.is_active },
		}).unwrap();
		setIsDisableModalVisible(false);
	};

	return (
		<>
			<Flex justify="space-between" align="center">
				<Space>
					<Button onClick={() => navigate(-1)} icon={<IoMdArrowRoundBack />} />
					<Typography.Title
						level={2}
						className="mb-0"
					>{`${userData?.first_name} ${userData?.last_name}`}</Typography.Title>
				</Space>
				<Dropdown
					trigger={["click"]}
					menu={{
						items: [
							isSuperUser(user) && {
								label: "Edit Staff",
								key: "edit-staff",
								onClick: () => setIsResetModalVisible(true),
							},

							{
								label: "Send Password Reset Link",
								key: "send-password-reset-link",
								onClick: () => setIsResetModalVisible(true),
							},

							isSuperUser(user) && {
								label: userData?.is_active ? "Disable Staff" : "Enable Staff",
								key: "delete-staff",
								danger: userData?.is_active ? true : false,
								onClick: () => setIsDisableModalVisible(true),
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
					<Typography.Text>{userData?.email}</Typography.Text>
				</Space>
				<Space>
					<Typography.Text strong>Phone:</Typography.Text>
					<Typography.Text>
						{userData?.profile?.phone_number ?? "-"}
					</Typography.Text>
				</Space>
			</Flex>

			<AppConfirmModal
				title={userData?.is_active ? "Disable User" : "Enable User"}
				description={`Are you sure you want to ${
					userData?.is_active ? "disable" : "activate"
				} this user?`}
				open={isDisableModalVisible}
				onCancel={() => {
					setIsDisableModalVisible(false);
				}}
				onOk={handleDisableUser}
				deleteConfirm={Boolean(userData?.is_active)}
				okText={userData?.is_active ? "Disable" : "Enable"}
			/>

			<AppConfirmModal
				title={"Send Password Reset Link"}
				description={
					"Are you sure you want to send a password reset link to this user?"
				}
				open={isResetModalVisible}
				onCancel={() => {
					setIsResetModalVisible(false);
				}}
				onOk={handleSendResetLink}
				deleteConfirm={false}
				okText={"Send"}
			/>
		</>
	);
};

export default StaffDetail;
