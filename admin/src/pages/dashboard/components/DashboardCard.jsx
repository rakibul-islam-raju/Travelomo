import { Card, Col, Space, Typography } from "antd";
import { FaHashtag } from "react-icons/fa";

export default function DashboardCard({ title, subtitle }) {
	return (
		<Col sx={24} md={12} lg={6}>
			<Card hoverable size="small" title={subtitle}>
				<Space align="baseline">
					<FaHashtag size={20} />
					<div>
						<Typography.Title level={2} className="mb-0">
							{title}
						</Typography.Title>
					</div>
				</Space>
			</Card>
		</Col>
	);
}
