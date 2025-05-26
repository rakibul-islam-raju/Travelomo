import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Metadata } from "next";
import Link from "next/link";
import ForgetPassForm from "./_componemts/ForgetPassForm";

export const metadata: Metadata = {
	title: "Forget Password",
	description: "Forget Password",
};

export default function ForgetPasswordPage() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Forget Password</CardTitle>
				<CardDescription>
					Enter your email address to reset your password
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ForgetPassForm />

				<div className="mt-4 text-center">
					<p className="text-muted-foreground">
						Remember your password?{" "}
						<Link className="" href="/login">
							Login
						</Link>
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
