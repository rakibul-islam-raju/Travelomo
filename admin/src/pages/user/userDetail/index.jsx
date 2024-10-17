import { useGetUserDetailsQuery } from "@redux/user/userApi";
import { Button, Space, Typography } from "antd";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useNavigate, useParams } from "react-router-dom";

const UserDetail = () => {
	const navigate = useNavigate();
	const { userId } = useParams();

	const { data: user } = useGetUserDetailsQuery(userId, {
		skip: !userId,
	});

	return (
		<div>
			<div>
				<Space>
					<Button onClick={() => navigate(-1)} icon={<IoMdArrowRoundBack />} />
					<Typography.Title
						level={2}
						className="mb-0"
					>{`${user?.first_name} ${user?.last_name}`}</Typography.Title>
				</Space>
			</div>
		</div>
	);
};

export default UserDetail;
