"use client";

import { BaseForm } from "@/components/molecules/form/BaseForm";
import { PasswordField } from "@/components/molecules/form/PasswordField";
import { TextField } from "@/components/molecules/form/TextField";
import { Button } from "@/components/ui/button";
import { useZodForm } from "@/hooks/useZodForm";
import { authServices } from "@/services/authServices";
import { useAuthStore } from "@/stores/authStore";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { defaultLoginValues, LoginFormValues, loginSchema } from "./schema";

export default function LoginForm() {
	const router = useRouter();
	const { setUser } = useAuthStore();

	const { mutate: login, isPending } = useMutation({
		mutationFn: authServices.login,
	});

	const form = useZodForm(loginSchema, {
		defaultValues: defaultLoginValues,
		mode: "onChange",
	});

	const onSubmit = async (data: LoginFormValues) => {
		login(data, {
			onSuccess: (response) => {
				toast.success("Login successful");
				setUser(response.user);
				router.replace("/");
			},
		});
	};

	return (
		<BaseForm form={form} onSubmit={onSubmit}>
			<div className="space-y-4">
				<TextField<LoginFormValues>
					name="email"
					label="Email Address"
					placeholder="Enter Email Address"
					required
				/>
				<PasswordField<LoginFormValues>
					name="password"
					label="Password"
					placeholder="Enter Password"
					required
				/>
			</div>
			<Button className="w-full mt-6" type="submit" disabled={isPending}>
				{isPending ? "Logging in..." : "Login"}
			</Button>
		</BaseForm>
	);
}
