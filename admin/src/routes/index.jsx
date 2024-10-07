import AuthLayout from "@layouts/AuthLayout";
import DashboardLayout from "@layouts/DashboardLayout";
import ForgetPassword from "@pages/auth/forgetPassword";
import Login from "@pages/auth/login";
import ResetPassword from "@pages/auth/resetPassword";
import Dashboard from "@pages/dashboard";
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
]);
