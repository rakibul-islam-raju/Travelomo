import React from "react";
import SectionTitle from "./SectionTitle";

type Props = {
	title?: string;
	children: React.ReactNode;
	action?: React.ReactNode;
};

export default function Section({
	title,
	children,
	action,
}: Props): React.ReactNode {
	return (
		<section className="py-10">
			<div className="flex justify-between items-center">
				{title && <SectionTitle text={title} className="mb-6" />}
				{action && <div className="ml-auto">{action}</div>}
			</div>
			{children}
		</section>
	);
}
