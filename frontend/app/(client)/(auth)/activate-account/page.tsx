"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/fetchInstance";
import { extractErrorMessage } from "@/utils/extractErrorMessages";
import { CircleCheck, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BeatLoader } from "react-spinners";

export default function ActivateAccount() {
	const router = useRouter();
	const { toast } = useToast();

	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<boolean>(false);

	useEffect(() => {
		console.log("call");

		const handleActivate = async (email: string, token: string) => {
			try {
				setSuccess(false);
				setError(null);
				setIsLoading(true);
				await apiFetch(`/auth/activate-account/?email=${email}&token=${token}`);
				setSuccess(true);
				toast({
					variant: "success",
					title: "Account activated successfully",
					description: "You can now login to your account",
				});
				router.push("/login");
			} catch (error) {
				setError(extractErrorMessage(error));
			} finally {
				setIsLoading(false);
			}
		};

		const urlParams = new URLSearchParams(window.location.search);
		const email = urlParams.get("email");
		const token = urlParams.get("token") || urlParams.get("amp;token");

		if (!email || !token) {
			router.push("/login");
		}
		if (email && token) {
			handleActivate(email, token);
		}
	}, [router]);

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
						<p className="text-lg mb-4 text-destructive mt-4">{error}</p>
					</div>
				) : (
					success && (
						<div className="text-center bg-green-500/10 p-4 rounded-md">
							<CircleCheck className="w-10 h-10 text-primary mx-auto" />
							<p className="text-lg mb-4 text-primary mt-4">
								Account activated successfully
							</p>
							<Button onClick={() => router.push("/login")}>Login Now</Button>
						</div>
					)
				)}
			</CardContent>
		</Card>
	);
}
