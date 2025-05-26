"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authServices } from "@/services/authServices";
import { useAuthStore } from "@/stores/authStore";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HeaderLoginButton() {
	const router = useRouter();
	const { isAuthenticated, user } = useAuthStore();

	const handleLogout = async () => {
		await authServices.logout();
		router.push("/login");
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
							<AvatarFallback>{user?.first_name?.charAt(0)}</AvatarFallback>
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
