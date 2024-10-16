import { Col, Row } from "antd";
import DashboardCard from "./components/DashboardCard";
import PendingApproval from "./components/PendingApproval";

const Dashboard = () => {
	return (
		<div>
			<Row gutter={[12, 12]}>
				<DashboardCard title="100" subtitle="Travellers" />
				<DashboardCard title="100" subtitle="Vendors" />
				<DashboardCard title="100" subtitle="Running Events" />
				<DashboardCard title="100" subtitle="Completed Events" />
			</Row>

			<Row gutter={[12, 12]} style={{ marginTop: "24px" }}>
				<Col sx={24} md={12}>
					<PendingApproval />
				</Col>
				{/* <Col sx={24} md={12}>
					<PendingApproval />
				</Col> */}
			</Row>
		</div>
	);
};

export default Dashboard;
