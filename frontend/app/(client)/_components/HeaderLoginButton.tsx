"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogIn } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function HeaderLoginButton() {
	const { data: session } = useSession();

	const loggedIn = session?.user;

	return (
		<>
			{!loggedIn ? (
				<Link href="/login">
					<Button variant="default">
						<LogIn /> Login
					</Button>
				</Link>
			) : (
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Avatar>
							{session?.user?.image && (
								<AvatarImage src={session?.user?.image} />
							)}
							<AvatarFallback>{session?.user?.name?.charAt(0)}</AvatarFallback>
						</Avatar>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem asChild>
							<Link className="cursor-pointer text-inherit" href="/profile">
								Profile
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem>
							<Link className="cursor-pointer text-inherit" href="/dashboard">
								Dashboard
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => signOut({ callbackUrl: "/login" })}
							className="cursor-pointer text-red-600 hover:!text-red-600 hover:!bg-red-100"
						>
							Logout
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</>
	);
}
