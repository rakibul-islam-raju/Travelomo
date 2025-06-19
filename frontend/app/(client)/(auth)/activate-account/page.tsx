"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authServices } from "@/services/authServices";
import { extractErrorMessage } from "@/utils/extractErrorMessages";
import { useQuery } from "@tanstack/react-query";
import { CircleCheck, ShieldAlert } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BeatLoader } from "react-spinners";

export default function ActivateAccount() {
	const router = useRouter();
	const { toast } = useToast();

	const [redirectInterval, setRedirectInterval] = useState<number>(5);
	const searchParams = useSearchParams();
	const email = searchParams.get("email");
	const token = searchParams.get("token");

	const {
		isSuccess,
		isPending: isLoading,
		error,
	} = useQuery({
		queryKey: ["activate-account"],
		queryFn: () =>
			authServices.activateAccount({
				email: email!,
				token: token!,
			}),
		enabled: !!email && !!token,
	});

	useEffect(() => {
		if (isSuccess) {
			const interval = setInterval(() => {
				setRedirectInterval((prev) => {
					if (prev <= 1) {
						clearInterval(interval);
						router.push("/login");
						return 0;
					}
					return prev - 1;
				});

				return () => clearInterval(interval);
			}, 1000); //
		}
	}, [isSuccess]);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-center">Activate Account</CardTitle>
				<CardDescription className="text-center">
					Activate your account to continue
				</CardDescription>
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
							{extractErrorMessage(error)}
						</p>
					</div>
				) : (
					isSuccess && (
						<div className="text-center bg-green-500/10 p-4 rounded-md">
							<CircleCheck className="w-10 h-10 text-primary mx-auto" />
							<p className="text-lg mb-4 text-primary mt-4">
								Account activated successfully
							</p>
							<p className="text-sm text-muted-foreground">
								Redirecting to login page in {redirectInterval} seconds...
							</p>
							<Button className="mt-4" onClick={() => router.push("/login")}>
								Login Now
							</Button>
						</div>
					)
				)}
			</CardContent>
		</Card>
	);
}
