import { ChevronsRight } from "lucide-react";
import Link from "next/link";

export default function ViewAllBtn() {
	return (
		<Link
			href="/events"
			className="text-primary text-sm font-semibold flex items-center gap-2 hover:bg-primary/10 px-2 py-1 rounded transition-colors ease-in-out"
		>
			View All <ChevronsRight className="w-4 h-4" />
		</Link>
	);
}
