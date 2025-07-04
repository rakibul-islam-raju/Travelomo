import { Inbox } from "lucide-react";

type Props = {
	message?: string;
};

export const NoDataFound = ({ message = "No data found" }: Props) => {
	return (
		<div className="flex justify-center items-center py-12">
			<div className="bg-muted text-muted-foreground rounded-2xl p-8 flex flex-col items-center gap-4 shadow-sm w-full max-w-md text-center">
				<Inbox className="w-10 h-10" />
				<p className="text-lg font-medium">{message}</p>
			</div>
		</div>
	);
};
