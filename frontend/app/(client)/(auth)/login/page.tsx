import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Metadata } from "next";
import Link from "next/link";
import LoginForm from "./_components/LoginForm";

export const metadata: Metadata = {
	title: "Login",
	description: "Login to your account",
};

export default function LoginPage() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Login</CardTitle>
				<CardDescription>Please enter your details to login.</CardDescription>
			</CardHeader>
			<CardContent>
				<LoginForm />

				<div className="mt-4 text-center">
					<div className="">
						<Link
							className="text-primary hover:underline"
							href="/forget-password"
						>
							Forgot password?
						</Link>
					</div>
					<p className="text-muted-foreground">
						Don't have an account?{" "}
						<Link className="text-primary hover:underline" href="/registration">
							Register now
						</Link>
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
