import AuthLayout from "@layouts/AuthLayout";
import DashboardLayout from "@layouts/DashboardLayout";
import ForgetPassword from "@pages/auth/forgetPassword";
import Login from "@pages/auth/login";
import ResetPassword from "@pages/auth/resetPassword";
import Dashboard from "@pages/dashboard";
import NotFound from "@pages/NotFound";
import VendorDetail from "@pages/vendor/vendorDetail";
import VendorList from "@pages/vendor/vendorList";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
	{
		path: "/",
		element: <DashboardLayout />,
		children: [
			{
				path: "/",
				element: <Dashboard />,
			},
			{
				path: "/vendors",
				element: <VendorList />,
			},
			{
				path: "/vendors/:vendorId",
				element: <VendorDetail />,
			},
			{
				path: "*",
				element: <NotFound />,
			},
		],
	},
	{
		path: "/auth",
		element: <AuthLayout />,
		children: [
			{
				path: "login",
				element: <Login />,
			},
			{
				path: "forget-password",
				element: <ForgetPassword />,
			},
			{
				path: "reset-password",
				element: <ResetPassword />,
			},
		],
	},
	{
		path: "*",
		element: <NotFound />,
	},
]);
