"use client";

import { BaseForm } from "@/components/molecules/form/BaseForm";
import { PasswordField } from "@/components/molecules/form/PasswordField";
import { TextField } from "@/components/molecules/form/TextField";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { useZodForm } from "@/hooks/useZodForm";
import { authServices } from "@/services/authServices";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	VendorRegistrationFormValues,
	vendorRegistrationInitialValues,
	vendorRegistrationSchema,
} from "./schema";

export default function VendorRegistrationForm() {
	const router = useRouter();

	const { mutate: register, isPending } = useMutation({
		mutationFn: (
			data: Omit<VendorRegistrationFormValues, "confirm_password">
		) => authServices.register(data, "vendor"),
	});

	const form = useZodForm(vendorRegistrationSchema, {
		defaultValues: vendorRegistrationInitialValues,
		mode: "onChange",
	});

	const onSubmit = async (data: VendorRegistrationFormValues) => {
		if (data?.confirm_password) {
			const { confirm_password, ...registrationData } = data;
			register(registrationData, {
				onSuccess: () => {
					toast.success("Registration successful", {
						description:
							"An email has been sent to verify your account to continue",
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
					<div className="grid grid-cols-2 gap-4">
						<TextField<VendorRegistrationFormValues>
							name="first_name"
							label="First Name"
							placeholder="Enter First Name"
							required
						/>
						<TextField<VendorRegistrationFormValues>
							name="last_name"
							label="Last Name"
							placeholder="Enter Last Name"
							required
						/>
					</div>
					<TextField<VendorRegistrationFormValues>
						name="email"
						label="Email Address"
						placeholder="Enter Email Address"
						required
					/>
					<TextField<VendorRegistrationFormValues>
						name="store_name"
						label="Store Name"
						placeholder="Enter Store Name"
						required
					/>
					<PasswordField<VendorRegistrationFormValues>
						name="password"
						label="Password"
						placeholder="Enter Password"
						required
					/>
					<PasswordField<VendorRegistrationFormValues>
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
