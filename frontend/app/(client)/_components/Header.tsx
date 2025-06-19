import { siteConfig, topbarHeight } from "@/config/siteConfig";
import { cn } from "@/lib/utils";
import Link from "next/link";
import HeaderLoginButton from "./HeaderLoginButton";

export default function Header() {
	return (
		<header
			className={cn(
				"bg-primary text-primary-foreground sticky top-0 z-20 shadow-sm transition-all duration-300 flex items-center"
			)}
			style={{ height: `${topbarHeight}px` }}
		>
			<div className="container">
				{/* header main section */}
				<div className="flex items-center justify-between gap-6 transition-all duration-300 py-2">
					<Link href="/">
						<h1 className="text-xl font-bold text-white">{siteConfig.name}</h1>
					</Link>

					<div className="flex items-center gap-x-2">
						<Link href={"/vendor-registration"}>Become a vendor</Link>
						<HeaderLoginButton />
					</div>
				</div>
			</div>
		</header>
	);
}
