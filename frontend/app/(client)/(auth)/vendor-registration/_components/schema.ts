import { z } from "zod";

export const vendorRegistrationSchema = z
	.object({
		first_name: z.string().min(1, { message: "First name is required." }),
		last_name: z.string().min(1, { message: "Last name is required." }),
		store_name: z.string().min(1, { message: "Store name is required." }),
		email: z.string().email({ message: "Invalid email address." }),
		password: z
			.string()
			.min(6, { message: "Password must be at least 6 characters." }),
		confirm_password: z
			.string()
			.min(1, { message: "Confirm password is required." }),
	})
	.superRefine((data, ctx) => {
		if (data.password !== data.confirm_password) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Passwords do not match",
				path: ["confirm_password"],
			});
		}
	});

export type VendorRegistrationFormValues = z.infer<
	typeof vendorRegistrationSchema
>;

export const vendorRegistrationInitialValues: VendorRegistrationFormValues = {
	first_name: "",
	last_name: "",
	store_name: "",
	email: "",
	password: "",
	confirm_password: "",
};
