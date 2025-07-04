"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getFirstTwoCharOfFullName } from "@/lib/string";
import { authServices } from "@/services/authServices";
import { useAuthStore } from "@/stores/authStore";
import { LogIn } from "lucide-react";
import Link from "next/link";

export default function HeaderLoginButton() {
	const { isAuthenticated, user } = useAuthStore();

	const handleLogout = async () => {
		await authServices.logout();
		window.location.href = "/login";
	};

	return (
		<>
			{!isAuthenticated ? (
				<Link href="/login">
					<Button variant="default">
						<LogIn /> Login
					</Button>
				</Link>
			) : (
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Avatar>
							{user?.avatar && <AvatarImage src={user?.avatar} />}
							<AvatarFallback className="text-primary">
								{getFirstTwoCharOfFullName(`${user?.full_name}`)}
							</AvatarFallback>
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
							onClick={handleLogout}
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
