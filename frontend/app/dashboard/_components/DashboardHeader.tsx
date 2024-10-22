import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function DashboardHeader() {
	return (
		<header className="bg-primary text-white p-4">
			<div className="container flex justify-between items-center">
				<h1 className="text-2xl font-semibold">Dashboard</h1>
				<div className="flex items-center gap-4">
					<Button variant="default" className="text-white">
						Logout
						<LogOut />
					</Button>
				</div>
			</div>
		</header>
	);
}
