import Link from "next/link";
import { siteConfig } from "@/config/siteConfig";
import { Button } from "./ui/button";
import { LogIn, Search } from "lucide-react";

export default function Header() {
	return (
		<header className="bg-primary text-primary-foreground sticky top-0 z-20 shadow-sm pb-4">
			<div className="container">
				<div className="flex justify-end mb-3">
					<div className="flex items-center gap-x-6">
						<Link href={"/become-a-host"}>Become a host</Link>
						<Link href={"/register"}>Register</Link>
						<Link href={"/help-support"}>Help & Support</Link>
					</div>
				</div>
				<div className="flex items-center justify-between gap-6">
					<Link href="/">
						<h1 className="text-xl font-bold">{siteConfig.name}</h1>
					</Link>
					<div className="flex items-center flex-1">
						<input
							type="text"
							placeholder="Search"
							className="rounded rounded-r-none p-2 w-full outline-none focus:outline-none text-gray-800"
						/>
						<button className="p-2 rounded rounded-l-none bg-green-100 text-primary hover:bg-green-200 focus:bg-green-200 focus:outline-none">
							<Search />
						</button>
					</div>
					<Link href="/">
						<Button variant="default">
							<LogIn /> Login
						</Button>
					</Link>
				</div>
			</div>
		</header>
	);
}
