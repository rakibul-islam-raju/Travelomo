import { APP_DEFAULT_PATH } from "@config/index";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
	const navigate = useNavigate();
	const handleBackHome = () => {
		navigate(APP_DEFAULT_PATH);
	};

	return (
		<>
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100%",
				}}
			>
				<Result
					status="404"
					title="404"
					subTitle="Sorry, the page you visited does not exist."
					extra={
						<Button type="primary" onClick={handleBackHome}>
							Back Home
						</Button>
					}
				/>
			</div>
		</>
	);
};

export default NotFound;
