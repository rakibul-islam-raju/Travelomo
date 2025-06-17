import { z } from "zod";

export const loginSchema = z.object({
	email: z.string().email({ message: "Invalid email address." }),
	password: z
		.string()
		.min(4, { message: "Password must be at least 4 characters." }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const defaultLoginValues: LoginFormValues = {
	email: "",
	password: "",
};
