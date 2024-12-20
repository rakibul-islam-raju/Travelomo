"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { extractErrorMessage } from "@/utils/extractErrorMessages";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	first_name: z.string().min(1, { message: "First name is required." }),
	last_name: z.string().min(1, { message: "Last name is required." }),
	email: z.string().email({ message: "Invalid email address." }),
	password: z
		.string()
		.min(6, { message: "Password must be at least 6 characters." }),
});

export default function RegistrationPage() {
	const { toast } = useToast();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
	});

	const onSubmit = async (data: z.infer<typeof formSchema>) => {
		console.log(data);

		try {
			const res = await fetch(`/auth/register/customer/`, {
				method: "POST",
				body: JSON.stringify(data),
			});
			const result = await res.json();

			if (result?.id) {
				toast({
					variant: "success",
					title: "Registration Successful",
					description: "Please check your email for verification",
				});
			}

			form.reset();
			// If reset() is not working, we can manually clear the form fields
			form.setValue("first_name", "");
			form.setValue("last_name", "");
			form.setValue("email", "");
			form.setValue("password", "");
			// Clear any existing form errors
			form.clearErrors();
		} catch (error) {
			console.log("error =>", error);

			toast({
				variant: "destructive",
				title: "Error",
				description: extractErrorMessage(error),
			});
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Create an account</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="space-y-4">
							<FormField
								control={form.control}
								name="first_name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>First Name</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="last_name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Last Name</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email Address</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Password</FormLabel>
										<FormControl>
											<Input {...field} type="password" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<Button className="w-full mt-6" type="submit">
							Login
						</Button>
					</form>
				</Form>

				<div className="mt-4 text-center">
					<p className="text-muted-foreground">
						Already have an account?{" "}
						<Link className="" href="/login">
							Login
						</Link>
					</p>
					<Link className="" href="/vendor-registration">
						Create Vendor Account
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}
