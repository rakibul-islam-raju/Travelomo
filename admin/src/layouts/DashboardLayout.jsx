import {
	DashboardOutlined,
	MenuFoldOutlined,
	MenuUnfoldOutlined,
	UserOutlined,
} from "@ant-design/icons";
import useAuth from "@hooks/useAuth";
import { Avatar, Button, Layout, Menu, theme } from "antd";
import clsx from "clsx";
import { useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import styles from "./index.module.scss";
const { Header, Sider, Content } = Layout;

const DashboardLayout = () => {
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
			key: "/users",
			icon: <DashboardOutlined />,
			label: "Users",
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
					<Avatar icon={<UserOutlined />} />
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
