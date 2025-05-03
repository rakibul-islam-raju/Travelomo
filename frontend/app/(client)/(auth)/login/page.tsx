import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import LoginForm from "./_components/LoginForm";

export default function LoginPage() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Login</CardTitle>
			</CardHeader>
			<CardContent>
				<LoginForm />

				<div className="mt-4 text-center">
					<div className="">
						<Link className="" href="/forget-password">
							Forgot password?
						</Link>
					</div>
					<p className="text-muted-foreground">
						Don't have an account?{" "}
						<Link className="" href="/registration">
							Register
						</Link>
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
