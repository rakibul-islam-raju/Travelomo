"use client";
import { forgetPasswordInitialValues, forgetPasswordSchema } from "./schema";

import {
	GenericForm,
	GenericFormRef,
} from "@/components/molecules/form/GenericForm";
import { TextField } from "@/components/molecules/form/TextField";
import { Button } from "@/components/ui/button";
import { authServices } from "@/services/authServices";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { toast } from "sonner";
import { ForgetPasswordFormValues } from "./schema";

export default function ForgetPassForm() {
	const router = useRouter();

	const { mutate: register, isPending } = useMutation({
		mutationFn: (data: ForgetPasswordFormValues) =>
			authServices.forgetPassword(data),
	});

	const formRef = useRef<GenericFormRef<ForgetPasswordFormValues>>(null);

	const onSubmit = async () => {
		const data = formRef.current?.form.getValues();
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
			<GenericForm
				ref={formRef}
				schema={forgetPasswordSchema}
				initialValues={forgetPasswordInitialValues}
				onSubmit={onSubmit}
			>
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
			</GenericForm>
		</>
	);
}
