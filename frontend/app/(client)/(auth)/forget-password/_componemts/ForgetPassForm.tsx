"use client";
import { forgetPasswordInitialValues, forgetPasswordSchema } from "./schema";

import { BaseForm } from "@/components/molecules/form/BaseForm";
import { TextField } from "@/components/molecules/form/TextField";
import { Button } from "@/components/ui/button";
import { useZodForm } from "@/hooks/useZodForm";
import { authServices } from "@/services/authServices";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ForgetPasswordFormValues } from "./schema";

export default function ForgetPassForm() {
	const router = useRouter();

	const { mutate: register, isPending } = useMutation({
		mutationFn: (data: ForgetPasswordFormValues) =>
			authServices.forgetPassword(data),
	});

	const form = useZodForm(forgetPasswordSchema, {
		defaultValues: forgetPasswordInitialValues,
		mode: "onChange",
	});

	const onSubmit = async (data: ForgetPasswordFormValues) => {
		if (data?.email) {
			register(data, {
				onSuccess: () => {
					toast.success("Password reset email sent", {
						description: "An email has been sent to reset your password",
					});
					router.push("/login");
				},
			});
		}
	};

	return (
		<>
			<BaseForm form={form} onSubmit={onSubmit}>
				<div className="space-y-4">
					<TextField<ForgetPasswordFormValues>
						name="email"
						label="Email Address"
						placeholder="Enter Email Address"
						required
					/>
				</div>
				<Button className="w-full mt-6" type="submit" disabled={isPending}>
					{isPending ? "Sending..." : "Send Reset Link"}
				</Button>
			</BaseForm>
		</>
	);
}
