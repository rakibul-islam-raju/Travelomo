import { cn } from "@/lib/utils";

type Props = {
	text: string;
	className?: string;
};

const SectionTitle = (props: Props) => {
	return (
		<div
			className={cn(
				"text-2xl font-bold text-gray-700 font-poppins",
				props.className
			)}
		>
			{props.text}
		</div>
	);
};

export default SectionTitle;
