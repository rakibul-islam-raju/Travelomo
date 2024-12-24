import {
	DashboardOutlined,
	LogoutOutlined,
	MenuFoldOutlined,
	MenuUnfoldOutlined,
	UserOutlined,
} from "@ant-design/icons";
import useAuth from "@hooks/useAuth";
import { userLoggedOut } from "@redux/auth/authSlice";
import { Button, Dropdown, Layout, Menu, theme } from "antd";
import clsx from "clsx";
import { useState } from "react";
import { FaUserFriends, FaUserShield } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import styles from "./index.module.scss";
const { Header, Sider, Content } = Layout;

const DashboardLayout = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocation();

	const isLoggedIn = useAuth();

	const [collapsed, setCollapsed] = useState(false);

	const {
		token: { colorBgContainer },
	} = theme.useToken();

	const handleMenuClick = (e) => {
		navigate(e.key);
	};

	const menuItems = [
		{
			key: "/",
			icon: <DashboardOutlined />,
			label: "Dashboard",
		},
		{
			key: "/vendors",
			icon: <DashboardOutlined />,
			label: "Vendors",
		},
		{
			key: "/events",
			icon: <DashboardOutlined />,
			label: "Events",
		},
		{
			// key: "/users",
			icon: <FaUserFriends />,
			label: "Users",
			children: [
				{
					key: "/users",
					icon: <FaUserFriends />,
					label: "Users",
				},
				{
					key: "/staffs",
					icon: <FaUserShield />,
					label: "Staffs",
				},
			],
		},
	];

	const userMenuItems = [
		{
			icon: <UserOutlined />,
			key: "/profile",
			label: "Profile",
			onClick: () => {
				navigate("/profile");
			},
		},
		{
			icon: <LogoutOutlined />,
			label: "Logout",
			danger: true,
			onClick: () => dispatch(userLoggedOut()),
		},
	];

	return isLoggedIn ? (
		<Layout className={styles.dashboardLayout}>
			<Header className={styles.dashboardHeader}>
				<Button
					size="large"
					type="text"
					icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
					onClick={() => setCollapsed(!collapsed)}
				/>
				<div>
					<Dropdown trigger={['click']} menu={{ items: userMenuItems, style: { width: 150 } }}>
						<Button shape="circle" icon={<UserOutlined />} />
					</Dropdown>
				</div>
			</Header>
			<Layout>
				<Sider
					trigger={null}
					collapsible
					collapsed={collapsed}
					style={{
						background: colorBgContainer,
					}}
					className={styles.dashboardSider}
					width={200}
					collapsedWidth={65}
				>
					<div className="" />
					<Menu
						theme="light"
						mode="inline"
						defaultSelectedKeys={[location.pathname]}
						items={menuItems}
						onClick={handleMenuClick}
					/>
				</Sider>

				<Content
					className={clsx(styles.dashboardContent, {
						[styles.isCollapsed]: collapsed,
					})}
				>
					<Outlet />
				</Content>
			</Layout>
		</Layout>
	) : (
		<Navigate to={"/auth/login"} state={{ from: location }} replace />
	);
};

export default DashboardLayout;
