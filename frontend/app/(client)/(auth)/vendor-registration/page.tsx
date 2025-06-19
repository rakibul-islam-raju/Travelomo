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
				<CardTitle>Become A Vendor</CardTitle>
				<CardDescription>
					Create an account to start your business
				</CardDescription>
			</CardHeader>
			<CardContent>
				<VendorRegistrationForm />

				<div className="mt-4 text-center">
					<Link className="hover:underline text-primary" href="/registration">
						Create customer account
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}
