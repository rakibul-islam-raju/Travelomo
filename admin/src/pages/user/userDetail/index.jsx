import { MoreOutlined } from "@ant-design/icons";
import AppConfirmModal from "@components/AppConfirmModal";
import {
	useDeactivateUserMutation,
	useGetUserDetailsQuery,
} from "@redux/user/userApi";
import { Button, Divider, Dropdown, Flex, Space, Typography } from "antd";
import { useState } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useNavigate, useParams } from "react-router-dom";

const UserDetail = () => {
	const navigate = useNavigate();
	const { userId } = useParams();

	const { data: user } = useGetUserDetailsQuery(userId, {
		skip: !userId,
	});
	const [deactivateUser] = useDeactivateUserMutation();

	const [isResetModalVisible, setIsResetModalVisible] = useState(false);
	const [isDisableModalVisible, setIsDisableModalVisible] = useState(false);

	const handleSendResetLink = () => {
		// setSendResetList(true);
	};

	const handleDisableUser = async () => {
		await deactivateUser({
			id: user?.id,
			data: { is_active: !user.is_active },
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
					>{`${user?.first_name} ${user?.last_name}`}</Typography.Title>
				</Space>
				<Dropdown
					trigger={["click"]}
					menu={{
						items: [
							{
								label: "Send Password Reset Link",
								key: "send-password-reset-link",
								onClick: () => setIsResetModalVisible(true),
							},
							{
								label: user?.is_active ? "Disable User" : "Enable User",
								key: "disable-user",
								danger: user?.is_active ? true : false,
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
				title={user?.is_active ? "Disable User" : "Enable User"}
				description={`Are you sure you want to ${
					user?.is_active ? "disable" : "activate"
				} this user?`}
				open={isDisableModalVisible}
				onCancel={() => {
					setIsDisableModalVisible(false);
				}}
				onOk={handleDisableUser}
				deleteConfirm={Boolean(user?.is_active)}
				okText={user?.is_active ? "Disable" : "Enable"}
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

export default UserDetail;
