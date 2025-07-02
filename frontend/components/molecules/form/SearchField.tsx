import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { ChangeEvent } from "react";

type SearchFieldProps = {
	label?: string;
	placeholder?: string;
	icon?: boolean;
	className?: string;
	value?: string;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
};

export function SearchField({
	label,
	placeholder,
	icon = true,
	className,
	value,
	onChange,
}: SearchFieldProps) {
	return (
		<div
			className={cn(
				"flex flex-col gap-2 w-full md:w-[400px] max-w-full",
				className
			)}
		>
			{label && <Label>{label}</Label>}
			<div className="relative">
				{icon && (
					<div className="absolute inset-y-0 left-0 flex items-center pl-3">
						<Search className="w-4 h-4 text-muted-foreground" />
					</div>
				)}
				<Input
					placeholder={placeholder}
					className={cn(icon && "pl-10")}
					value={value}
					onChange={onChange}
				/>
			</div>
		</div>
	);
}
