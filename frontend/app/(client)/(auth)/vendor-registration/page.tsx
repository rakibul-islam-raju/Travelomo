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
import { useRegisterVendorMutation } from "@/lib/features/auth/authApi";
import { extractErrorMessage } from "@/utils/extractErrorMessages";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	first_name: z.string().min(1, { message: "First name is required." }),
	last_name: z.string().min(1, { message: "Last name is required." }),
	store_name: z.string().min(1, { message: "Company name is required." }),
	email: z.string().email({ message: "Invalid email address." }),
	password: z
		.string()
		.min(6, { message: "Password must be at least 6 characters." }),
});

export default function VendorRegistrationPage() {
	const router = useRouter();
	const { toast } = useToast();
	const [registerVendor, { isLoading }] = useRegisterVendorMutation();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			first_name: "",
			last_name: "",
			store_name: "",
			email: "",
			password: "",
		},
	});

	const onSubmit = async (data: z.infer<typeof formSchema>) => {
		try {
			await registerVendor(data).unwrap();

			toast({
				variant: "success",
				title: "Registration successful",
				description: "An email has been sent to verify your account",
			});

			// Redirect to login page after successful registration
			router.push("/login");
		} catch (error) {
			const errorMessage = extractErrorMessage(error);
			toast({
				variant: "destructive",
				title: "Registration failed",
				description: errorMessage,
			});
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Become a vendor</CardTitle>
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
								name="store_name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Company Name</FormLabel>
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
						<Button className="w-full mt-6" type="submit" disabled={isLoading}>
							{isLoading ? "Registering..." : "Register"}
						</Button>
					</form>
				</Form>

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
