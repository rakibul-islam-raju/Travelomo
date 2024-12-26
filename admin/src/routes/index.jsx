import AuthLayout from "@layouts/AuthLayout";
import DashboardLayout from "@layouts/DashboardLayout";
import ForgetPassword from "@pages/auth/forgetPassword";
import Login from "@pages/auth/login";
import ResetPassword from "@pages/auth/resetPassword";
import Dashboard from "@pages/dashboard";
import EventDetails from "@pages/event/eventDetails";
import EventList from "@pages/event/eventList";
import NotFound from "@pages/NotFound";
import StaffDetail from "@pages/user/staffDetail";
import UserDetail from "@pages/user/userDetail";
import UserList from "@pages/user/userList";
import StaffList from "@pages/user/userList/StaffList";
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
				path: "/events",
				element: <EventList />,
			},
			{
				path: "/events/:eventId",
				element: <EventDetails />,
			},
			{
				path: "/users",
				element: <UserList />,
			},
			{
				path: "/users/:userId",
				element: <UserDetail />,
			},
			{
				path: "/staffs",
				element: <StaffList />,
			},
			{
				path: "/staffs/:staffId",
				element: <StaffDetail />,
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
