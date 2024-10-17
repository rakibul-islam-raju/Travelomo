import { useGetStaffDetailsQuery } from "@redux/user/userApi";
import { Button, Space, Typography } from "antd";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useNavigate, useParams } from "react-router-dom";

const StaffDetail = () => {
	const navigate = useNavigate();
	const { staffId } = useParams();

	const { data: staff } = useGetStaffDetailsQuery(staffId, {
		skip: !staffId,
	});

	return (
		<div>
			<Space>
				<Button onClick={() => navigate(-1)} icon={<IoMdArrowRoundBack />} />
				<Typography.Title
					level={2}
					className="mb-0"
				>{`${staff?.first_name} ${staff?.last_name}`}</Typography.Title>
			</Space>
		</div>
	);
};

export default StaffDetail;
