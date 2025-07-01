import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { ReactNode } from "react";
import { FieldValues, Path, useFormContext } from "react-hook-form";

type TextFieldProps<T extends FieldValues> = {
	name: Path<T>;
	label?: string;
	type?: "text" | "email" | "number";
	placeholder?: string;
	required?: boolean;
	action?: () => void;
	icon?: ReactNode;
	loading?: boolean;
	className?: string;
	inputClass?: string;
	disabled?: boolean;
	iconClass?: string;
	helpText?: string;
};

/**
 * A text field component.
 * @param name The name of the field.
 * @param label The label of the field.
 * @param type The type of the field.
 * @param placeholder The placeholder of the field.
 * @param required If the field is required.
 * @param action The action to be performed on the field.
 * @param icon The icon of the field.
 * @param loading If the field is loading.
 * @param className The class name of the
 * @param inputClass The class name of the input.
 * @param iconClass The class name of the
 * @param disabled If the field is disabled.
 *
 * @returns The text field component.
 *
 * @example
 * ```tsx
 * <TextField name="name" label="Name" />
 * ```
 */

export const TextField = <T extends FieldValues>({
	name,
	label,
	type = "text",
	placeholder = "",
	required = false,
	action,
	icon,
	loading,
	className,
	inputClass,
	iconClass,
	helpText,
	disabled = false,
}: TextFieldProps<T>) => {
	const { control } = useFormContext<T>();
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className={cn(className)}>
					{label && (
						<FormLabel htmlFor={name} className="flex gap-x-2 items-center">
							<span>{label}</span>
							{helpText && (
								<Tooltip>
									<TooltipTrigger asChild>
										<span className="cursor-help text-sm text-gray-500 hover:text-gray-700">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<circle cx="12" cy="12" r="10" />
												<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
												<line x1="12" y1="17" x2="12.01" y2="17" />
											</svg>
										</span>
									</TooltipTrigger>
									<TooltipContent side="right">{helpText}</TooltipContent>
								</Tooltip>
							)}
							{required && <span className="ml-1 text-red-500">*</span>}
						</FormLabel>
					)}
					<FormControl>
						<div className="relative flex items-center gap-2">
							<Input
								{...field}
								type={type}
								placeholder={placeholder ?? "Enter a value"}
								className={cn(`w-full ${inputClass}`, action && "pr-12")}
								id={name}
								disabled={disabled}
							/>

							{loading && <Spinner />}

							{action && (
								<Button
									variant={"ghost"}
									size={"sm"}
									onClick={action}
									type="button"
									className={cn("absolute right-0.5 top-0.5", iconClass)}
								>
									{icon ? icon : <X className="h-4 w-4 text-red-500" />}
								</Button>
							)}

							{!action && icon && (
								<div className={cn("absolute right-2 top-3", iconClass)}>
									{icon}
								</div>
							)}
						</div>
					</FormControl>

					<FormMessage className="line-clamp-1 text-xs" />
				</FormItem>
			)}
		/>
	);
};

TextField.displayName = "TextField";
