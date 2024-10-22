import { cn } from "@/lib/utils";
import React from "react";

type Props = {
	text: string;
	className?: string;
};

const SectionTitle = (props: Props) => {
	return (
		<div
			className={cn(
				"text-2xl font-bold mb-4 mt-2 text-gray-700 font-poppins",
				props.className
			)}
		>
			{props.text}
		</div>
	);
};

export default SectionTitle;
