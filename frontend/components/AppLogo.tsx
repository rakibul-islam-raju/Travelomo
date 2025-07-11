import { siteConfig } from "@/config/siteConfig";
import { cn } from "@/lib/utils";
import { MapPinCheckInside } from "lucide-react";
import Link from "next/link";

type Props = {
	className?: string;
};

export const AppLogo: React.FC<Props> = ({ className }) => {
	return (
		<Link
			prefetch
			href="/"
			className={cn("flex gap-2 items-center", className)}
		>
			<MapPinCheckInside />
			<h1 className="text-2xl font-mono mt-1.5">{siteConfig.name}</h1>
		</Link>
	);
};
