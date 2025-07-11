import { AppLogo } from "@/components/AppLogo";
import { topbarHeight } from "@/config/siteConfig";
import { cn } from "@/lib/utils";
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
					<AppLogo />

					<div className="flex items-center gap-x-2">
						<HeaderLoginButton />
					</div>
				</div>
			</div>
		</header>
	);
}
