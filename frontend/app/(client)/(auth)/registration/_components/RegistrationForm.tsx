"use client";

import {
	GenericForm,
	GenericFormRef,
} from "@/components/molecules/form/GenericForm";
import { PasswordField } from "@/components/molecules/form/PasswordField";
import { TextField } from "@/components/molecules/form/TextField";
import { Button } from "@/components/ui/button";
import { authServices } from "@/services/authServices";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { toast } from "sonner";
import {
	RegistrationFormValues,
	registrationInitialValues,
	registrationSchema,
} from "./schema";

export default function RegistrationForm() {
	const router = useRouter();

	const { mutate: register, isPending } = useMutation({
		mutationFn: (data: Omit<RegistrationFormValues, "confirm_password">) =>
			authServices.register(data, "customer"),
	});

	const formRef = useRef<GenericFormRef<RegistrationFormValues>>(null);

	const onSubmit = async () => {
		const data = formRef.current?.form.getValues();
		if (data?.confirm_password) {
			const { confirm_password, ...registrationData } = data;
			register(registrationData, {
				onSuccess: () => {
					toast.success("Registration successful", {
						description:
							"An email has been sent to verify your account to continue",
					});
					// router.push("/login");
				},
			});
		}
	};

	return (
		<>
			<GenericForm
				ref={formRef}
				schema={registrationSchema}
				initialValues={registrationInitialValues}
				onSubmit={onSubmit}
			>
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
					{isPending ? "Registering..." : "Register"}
				</Button>
			</GenericForm>
		</>
	);
}
