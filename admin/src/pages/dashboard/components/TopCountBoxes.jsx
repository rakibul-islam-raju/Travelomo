import { useGetDashboardCountStatsQuery } from "@redux/dashboard/dashboardApi";
import DashboardCard from "./DashboardCard";

export default function TopCountBoxes() {
	const { data } = useGetDashboardCountStatsQuery();

	return (
		<>
			<DashboardCard title={data?.total_travellers} subtitle="Travellers" />
			<DashboardCard title={data?.total_vendors} subtitle="Vendors" />
			<DashboardCard
				title={data?.total_running_events}
				subtitle="Running Events"
			/>
			<DashboardCard
				title={data?.total_completed_events}
				subtitle="Completed Events"
			/>
		</>
	);
}
