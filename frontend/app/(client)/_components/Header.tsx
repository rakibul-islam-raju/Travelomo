import { siteConfig } from "@/config/siteConfig";
import Link from "next/link";
import HeaderLoginButton from "./HeaderLoginButton";

const headerTopLinks: { label: string; href: string }[] = [
	{
		label: "Become a vendor",
		href: "/vendor-registration",
	},
	{
		label: "Create an account",
		href: "/registration",
	},
	{
		label: "Help & Support",
		href: "/help-support",
	},
];

export default function Header() {
	return (
		<header className="bg-primary text-primary-foreground sticky top-0 z-20 shadow-sm transition-all duration-300">
			<div className="container">
				{/* header top section */}
				<div className="flex justify-end transition-all duration-300 h-12 opacity-100">
					<div className="flex items-center gap-x-6 text-sm py-3">
						{headerTopLinks.map((link) => (
							<Link
								key={link.href}
								className="text-white hover:text-primary-foreground/80 transition-colors"
								href={link.href}
							>
								{link.label}
							</Link>
						))}
					</div>
				</div>

				{/* header main section */}
				<div className="flex items-center justify-between gap-6 transition-all duration-300 py-2">
					<Link href="/">
						<h1 className="text-xl font-bold text-white">{siteConfig.name}</h1>
					</Link>

					<div className="flex items-center gap-x-2">
						<HeaderLoginButton />
					</div>
				</div>
			</div>
		</header>
	);
}
