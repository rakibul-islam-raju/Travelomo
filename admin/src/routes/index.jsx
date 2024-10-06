import AuthLayout from "@layouts/AuthLayout";
import ForgetPassword from "@pages/auth/forgetPassword";
import Login from "@pages/auth/login";
import ResetPassword from "@pages/auth/resetPassword";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
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
