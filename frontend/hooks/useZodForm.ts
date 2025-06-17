// hooks/useZodForm.ts
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, UseFormProps, UseFormReturn } from "react-hook-form";
import { z, ZodTypeAny } from "zod";

export function useZodForm<TSchema extends ZodTypeAny>(
	schema: TSchema,
	options?: Omit<UseFormProps<z.infer<TSchema>>, "resolver">
): UseFormReturn<z.infer<TSchema>> {
	return useForm<z.infer<TSchema>>({
		resolver: zodResolver(schema),
		mode: "onChange",
		...options,
	});
}
