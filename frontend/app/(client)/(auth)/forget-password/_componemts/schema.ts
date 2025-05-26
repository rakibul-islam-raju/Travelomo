import { z } from "zod";

export const forgetPasswordSchema = z.object({
	email: z.string().email({ message: "Invalid email address." }),
});

export type ForgetPasswordFormValues = z.infer<typeof forgetPasswordSchema>;

export const forgetPasswordInitialValues: ForgetPasswordFormValues = {
	email: "",
};
