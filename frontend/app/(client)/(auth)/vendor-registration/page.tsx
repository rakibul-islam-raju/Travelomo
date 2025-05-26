import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Metadata } from "next";
import Link from "next/link";
import VendorRegistrationForm from "./_components/VendorRegistrationForm";

export const metadata: Metadata = {
	title: "Vendor Registration",
	description: "Vendor Registration",
};

export default function VendorRegistrationPage() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>List your business</CardTitle>
				<CardDescription>
					Create an account to start your business
				</CardDescription>
			</CardHeader>
			<CardContent>
				<VendorRegistrationForm />

				<div className="mt-4 text-center">
					<p className="text-muted-foreground">
						Create customer account?{" "}
						<Link className="" href="/registration">
							Register
						</Link>
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
