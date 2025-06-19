import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Metadata } from "next";
import Link from "next/link";
import RegistrationForm from "./_components/RegistrationForm";

export const metadata: Metadata = {
	title: "Registration",
	description: "Create an account",
};

export default function RegistrationPage() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Create an account</CardTitle>
				<CardDescription>Create an account to continue</CardDescription>
			</CardHeader>
			<CardContent>
				<RegistrationForm />

				<div className="mt-4 text-center">
					<p className="text-muted-foreground">
						Already have an account?{" "}
						<Link className="text-primary hover:underline" href="/login">
							Login now
						</Link>
					</p>
					<Link
						className="text-primary hover:underline"
						href="/vendor-registration"
					>
						Become a vendor
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}
