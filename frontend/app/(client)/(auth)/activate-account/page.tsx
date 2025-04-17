"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isApiError } from "@/lib/baseApi";
import { useActivateAccountMutation } from "@/lib/features/auth/authApi";
import { CircleCheck, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BeatLoader } from "react-spinners";

export default function ActivateAccount() {
	const router = useRouter();
	const { toast } = useToast();

	const [redirectInterval, setRedirectInterval] = useState<number>(3);

	const [activateAccount, { isLoading, error, data }] =
		useActivateAccountMutation();

	useEffect(() => {
		const handleActivate = async (email: string, token: string) => {
			await activateAccount({ email, token }).unwrap();
			toast({
				variant: "success",
				title: "Account activated successfully",
				description: "You can now login to your account",
			});
			const interval = setInterval(() => {
				setRedirectInterval((prev) => {
					if (prev <= 1) {
						clearInterval(interval);
						router.push("/login");
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		};

		const urlParams = new URLSearchParams(window.location.search);
		const email = urlParams.get("email");
		const token = urlParams.get("token") || urlParams.get("amp;token");

		if (!email || !token) {
			// router.push("/login");
		}
		if (email && token) {
			handleActivate(email, token);
		}
	}, [window.location]);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-center">Activate Account</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="text-center">
						<p className="text-lg mb-6 text-muted-foreground">
							Activating your account. Please wait.
						</p>
						<div>
							<BeatLoader color="green" />
						</div>
					</div>
				) : error ? (
					<div className="text-center bg-destructive/10 p-4 rounded-md">
						<ShieldAlert className="w-10 h-10 text-destructive mx-auto" />
						<p className="text-lg mb-4 text-destructive mt-4">
							{isApiError(error)
								? (error.data as { message: string }).message
								: "Something went wrong. Please try again by clicking the activation link from your email."}
						</p>
					</div>
				) : (
					data && (
						<div className="text-center bg-green-500/10 p-4 rounded-md">
							<CircleCheck className="w-10 h-10 text-primary mx-auto" />
							<p className="text-lg mb-4 text-primary mt-4">
								Account activated successfully
							</p>
							<p className="text-sm text-muted-foreground">
								Redirecting to login page in {redirectInterval} seconds...
							</p>
							<Button onClick={() => router.push("/login")}>Login Now</Button>
						</div>
					)
				)}
			</CardContent>
		</Card>
	);
}
