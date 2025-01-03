import { Col, Row } from "antd";
import PendingApproval from "./components/PendingApproval";
import TopCountBoxes from "./components/TopCountBoxes";

const Dashboard = () => {
	return (
		<div>
			<Row gutter={[12, 12]}>
				<TopCountBoxes />
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
