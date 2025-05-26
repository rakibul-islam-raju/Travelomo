import { Loader2 } from "lucide-react";

export default function Spinner({ size = 5 }: { size?: number }) {
	return (
		<div className="flex items-center justify-center">
			<div className="animate-spin">
				<Loader2 className={`size-${size}`} />
			</div>
		</div>
	);
}
