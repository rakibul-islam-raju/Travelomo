import { cn } from "@/lib/utils";

type Props = {
	className?: string;
};

export default function Divider({ className }: Props) {
	return (
		<hr className={cn("w-full my-2 border-t border-gray-200", className)} />
	);
}
