import { MoreOutlined } from "@ant-design/icons";
import AppConfirmModal from "@components/AppConfirmModal";
import { useGetUserDetailsQuery } from "@redux/user/userApi";
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

	const [isResetModalVisible, setIsResetModalVisible] = useState(false);
	const [isDisableModalVisible, setIsDisableModalVisible] = useState(false);

	const handleSendResetLink = () => {
		// setSendResetList(true);
	};

	const handleDisableUser = () => {
		console.log("disable");
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
								label: "Deactivate User",
								key: "disable-user",
								danger: true,
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
				title={
					isDisableModalVisible ? "Disable User" : "Send Password Reset Link"
				}
				description={
					isDisableModalVisible
						? "Are you sure you want to deactivate this user?"
						: "Are you sure you want to send a password reset link to this user?"
				}
				open={isDisableModalVisible || isResetModalVisible}
				onCancel={() => {
					setIsDisableModalVisible(false);
					setIsResetModalVisible(false);
				}}
				onOk={isDisableModalVisible ? handleDisableUser : handleSendResetLink}
				deleteConfirm={isDisableModalVisible}
			/>
		</>
	);
};

export default UserDetail;
