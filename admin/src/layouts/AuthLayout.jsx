import { APP_DEFAULT_PATH } from "@config/index";
import useAuth from "@hooks/useAuth";
import { Col, Row } from "antd";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import styles from "./index.module.scss";

const AuthLayout = () => {
	const isLoggedIn = useAuth();
	const location = useLocation();

	console.log("isLoggedIn => ", isLoggedIn);

	return !isLoggedIn ? (
		<div className={styles.authLayout}>
			<Row justify="center" align="middle" className={styles.authLayoutRow}>
				<Col xs={24} md={12} lg={8}>
					<Outlet />
				</Col>
			</Row>
		</div>
	) : (
		<Navigate
			to={location?.state?.from?.pathname || APP_DEFAULT_PATH}
			replace
		/>
	);
};

export default AuthLayout;
