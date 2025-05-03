import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import RegistrationForm from "./_components/RegistrationForm";

export default function RegistrationPage() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Create an account</CardTitle>
			</CardHeader>
			<CardContent>
				<RegistrationForm />

				<div className="mt-4 text-center">
					<p className="text-muted-foreground">
						Already have an account?{" "}
						<Link className="" href="/login">
							Login
						</Link>
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
