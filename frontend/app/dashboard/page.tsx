import { EventPieChart } from "./_components/EventPieChart";
import { VendorInfo } from "./_components/VendorInfo";
import { VendorSummaryInfo } from "./_components/VendorSummaryInfo";

export default function Page() {
	return (
		<>
			<VendorSummaryInfo />

			<div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
				<VendorInfo />
				<EventPieChart />
			</div>
		</>
	);
}
