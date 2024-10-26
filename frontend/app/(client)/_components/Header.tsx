import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { siteConfig } from "@/config/siteConfig";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { Button } from "../../../components/ui/button";

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
						<Link href="/login">
							<Button variant="default">
								<LogIn /> Login
							</Button>
						</Link>
						<DropdownMenu>
							<DropdownMenuTrigger>
								<Avatar>
									<AvatarImage src="https://github.com/shadcn.png" />
									<AvatarFallback>CN</AvatarFallback>
								</Avatar>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuItem asChild>
									<Link className="cursor-pointer text-inherit" href="/profile">
										Profile
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem>
									<Link
										className="cursor-pointer text-inherit"
										href="/dashboard"
									>
										Dashboard
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem className="cursor-pointer text-red-600 hover:!text-red-600 hover:!bg-red-100">
									Logout
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</div>
		</header>
	);
}
