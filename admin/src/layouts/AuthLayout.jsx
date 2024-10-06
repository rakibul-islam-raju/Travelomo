import { APP_DEFAULT_PATH } from "@config/index";
import useAuth from "@hooks/useAuth";
import { Col, Row } from "antd";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const AuthLayout = () => {
	const isLoggedIn = useAuth();
	const location = useLocation();

	return !isLoggedIn ? (
		<Row justify="center" align="middle" style={{ height: "100dvh" }}>
			<Col xs={24} md={12} lg={8}>
				<Outlet />
			</Col>
		</Row>
	) : (
		<Navigate
			to={location?.state?.from?.pathname || APP_DEFAULT_PATH}
			replace
		/>
	);
};

export default AuthLayout;
