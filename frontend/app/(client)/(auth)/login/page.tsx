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
import { zodResolver } from "@hookform/resolvers/zod";
import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	email: z.string().email({ message: "Invalid email address." }),
	password: z
		.string()
		.min(4, { message: "Password must be at least 4 characters." }),
});

export default function LoginPage() {
	const router = useRouter();
	const { toast } = useToast();
	const [isPending, startTransition] = useTransition();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async (data: z.infer<typeof formSchema>) => {
		startTransition(async () => {
			try {
				const result = await signIn("credentials", {
					email: data.email,
					password: data.password,
					redirect: false,
				});

				if (result?.error) {
					toast({
						title: "Login failed",
						description: result.error,
						variant: "destructive",
					});
				}

				if (result?.ok) {
					toast({
						variant: "success",
						title: "Login successful",
					});

					// Small delay to ensure session is updated
					setTimeout(async () => {
						const session = await getSession();
						if (session?.user?.role === "vendor") {
							router.push("/dashboard");
						} else {
							router.push("/");
						}
					}, 300);
				}
			} catch (error) {
				toast({
					title: "Login failed",
					description: "An unexpected error occurred. Please try again.",
					variant: "destructive",
				});
			}
		});
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Login</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="space-y-4">
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
						<Button className="w-full mt-6" type="submit" disabled={isPending}>
							{isPending ? "Logging in..." : "Login"}
						</Button>
					</form>
				</Form>

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
