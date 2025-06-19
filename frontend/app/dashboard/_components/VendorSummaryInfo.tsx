"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { vendorStatService } from "@/services/vendorStatService";
import { useQuery } from "@tanstack/react-query";

export const VendorSummaryInfo = () => {
	const { data: vendorSummary } = useQuery({
		queryKey: ["vedor-summary"],
		queryFn: () => vendorStatService.getVendorSummary(),
	});

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<Card className="bg-gray-100 shadow hover:shadow-lg transition-all duration-300">
				<CardHeader>
					<h3 className="text-xl text-gray-700">Total Completed Events</h3>
				</CardHeader>
				<CardContent>
					<h2 className="text-3xl font-bold">
						{vendorSummary?.total_completed_events}
					</h2>
				</CardContent>
			</Card>
			<Card className="bg-gray-100 shadow hover:shadow-lg transition-all duration-300">
				<CardHeader>
					<h3 className="text-xl text-gray-700">Total Running Events</h3>
				</CardHeader>
				<CardContent>
					<h2 className="text-3xl font-bold">
						{vendorSummary?.total_running_events}
					</h2>
				</CardContent>
			</Card>
			<Card className="bg-gray-100 shadow hover:shadow-lg transition-all duration-300">
				<CardHeader>
					<h3 className="text-xl text-gray-700">Total Traveled Users</h3>
				</CardHeader>
				<CardContent>
					<h2 className="text-3xl font-bold">
						{vendorSummary?.total_user_travelled}
					</h2>
				</CardContent>
			</Card>
			<Card className="bg-gray-100 shadow hover:shadow-lg transition-all duration-300">
				<CardHeader>
					<h3 className="text-xl text-gray-700">Total Earnings</h3>
				</CardHeader>
				<CardContent>
					<h2 className="text-3xl font-bold">
						{vendorSummary?.total_earnings}
					</h2>
				</CardContent>
			</Card>
		</div>
	);
};
