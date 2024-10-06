import useAuth from "@hooks/useAuth";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const DashboardLayout = () => {
	const isLoggedIn = useAuth();
	const location = useLocation();

	return isLoggedIn ? (
		<>
			<Outlet />
		</>
	) : (
		<Navigate to={"/auth/login"} state={{ from: location }} replace />
	);
};

export default DashboardLayout;
