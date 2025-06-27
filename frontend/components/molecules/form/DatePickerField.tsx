"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Control, FieldValues, Path, useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FormDescription, FormMessage } from "@/components/ui/form";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";
import { CustomFormField } from "./CustomFormField";

interface DatePickerFieldProps<T extends FieldValues> {
	name: Path<T>;
	label?: string;
	required?: boolean;
	placeholder?: string;
	className?: string;
	control?: Control<T>;
	description?: string;
	helpText?: string;
}

/**
 * A date picker field component.
 * @example
 * ```tsx
 * <DatePickerField name="birthDate" label="Birth Date" />
 * ```
 */
export function DatePickerField<T extends FieldValues>({
	name,
	label,
	required = false,
	placeholder = "Pick a date",
	className,
	control: externalControl,
	description,
	helpText,
}: DatePickerFieldProps<T>) {
	const { control: contextControl } = useFormContext<T>();
	const control = externalControl || contextControl;

	return (
		<CustomFormField<T>
			name={name}
			label={label}
			required={required}
			control={control}
			className={className}
			helpText={helpText}
		>
			{({ field, error }) => (
				<div className="space-y-2">
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant={"outline"}
								className={cn(
									"w-full justify-start text-left font-normal",
									!field.value && "text-muted-foreground",
									error && "border-red-500 focus-visible:ring-red-500"
								)}
							>
								<CalendarIcon className="mr-2 h-4 w-4" />
								{field.value ? format(field.value, "PPP") : placeholder}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								selected={field.value}
								onSelect={field.onChange}
								initialFocus
							/>
						</PopoverContent>
					</Popover>
					{description && <FormDescription>{description}</FormDescription>}
					<FormMessage />
				</div>
			)}
		</CustomFormField>
	);
}

DatePickerField.displayName = "DatePickerField";
