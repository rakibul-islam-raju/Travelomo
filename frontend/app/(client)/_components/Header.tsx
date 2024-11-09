import { siteConfig } from "@/config/siteConfig";
import Link from "next/link";
import HeaderLoginButton from "./HeaderLoginButton";

export default function Header() {
	return (
		<header className="bg-primary text-primary-foreground sticky top-0 z-20 shadow-sm pb-4">
			<div className="container">
				<div className="flex justify-end mb-3 pt-1">
					<div className="flex items-center gap-x-6 text-sm">
						<Link className="text-white" href={"/become-a-host"}>
							Become a host
						</Link>
						<Link className="text-white" href={"/register"}>
							Create an account
						</Link>
						<Link className="text-white" href={"/help-support"}>
							Help & Support
						</Link>
					</div>
				</div>
				<div className="flex items-center justify-between gap-6">
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
