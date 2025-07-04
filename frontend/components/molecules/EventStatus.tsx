import { cn } from "@/lib/utils";

type Props = {
	status: string;
};

const statusColorMap: Record<string, string> = {
	draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
	published:
		"bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200",
	paused:
		"bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200",
	cancelled: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200",
	completed: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200",
	travelling:
		"bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200",
};

export const EventStatus: React.FC<Props> = ({ status }) => {
	const colorClass =
		statusColorMap[status.toLowerCase()] ?? "bg-muted text-muted-foreground";

	return (
		<div
			className={cn(
				"capitalize border px-2.5 py-0.5 text-xs font-semibold rounded-full",
				colorClass
			)}
		>
			{status}
		</div>
	);
};
