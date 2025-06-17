"use client";

import { BaseForm } from "@/components/molecules/form/BaseForm";
import { PasswordField } from "@/components/molecules/form/PasswordField";
import { TextField } from "@/components/molecules/form/TextField";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { useZodForm } from "@/hooks/useZodForm";
import { authServices } from "@/services/authServices";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	RegistrationFormValues,
	registrationInitialValues,
	registrationSchema,
} from "./schema";

export default function RegistrationForm() {
	const { mutate: register, isPending } = useMutation({
		mutationFn: (data: Omit<RegistrationFormValues, "confirm_password">) =>
			authServices.register(data, "customer"),
	});

	const form = useZodForm(registrationSchema, {
		defaultValues: registrationInitialValues,
		mode: "onChange",
	});

	const onSubmit = async (data: RegistrationFormValues) => {
		if (data?.confirm_password) {
			const { confirm_password, ...registrationData } = data;
			register(registrationData, {
				onSuccess: () => {
					toast.success("Registration successful", {
						description:
							"An email has been sent to verify your account to continue",
					});
					form.reset();
				},
			});
		}
	};

	return (
		<>
			<BaseForm form={form} onSubmit={onSubmit}>
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<TextField<RegistrationFormValues>
							name="first_name"
							label="First Name"
							placeholder="Enter First Name"
							required
						/>
						<TextField<RegistrationFormValues>
							name="last_name"
							label="Last Name"
							placeholder="Enter Last Name"
							required
						/>
					</div>
					<TextField<RegistrationFormValues>
						name="email"
						label="Email Address"
						placeholder="Enter Email Address"
						required
					/>
					<PasswordField<RegistrationFormValues>
						name="password"
						label="Password"
						placeholder="Enter Password"
						required
					/>
					<TextField<RegistrationFormValues>
						name="confirm_password"
						label="Confirm Password"
						placeholder="Enter Confirm Password"
						required
					/>
				</div>
				<Button className="w-full mt-6" type="submit" disabled={isPending}>
					Register {isPending && <Spinner />}
				</Button>
			</BaseForm>
		</>
	);
}
