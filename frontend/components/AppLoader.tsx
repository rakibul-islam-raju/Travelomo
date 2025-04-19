import { Loader2 } from "lucide-react";

export const AppLoader = () => {
	return (
		<div className="flex items-center justify-center h-full">
			<Loader2 className="animate-spin" size={48} />
		</div>
	);
};
