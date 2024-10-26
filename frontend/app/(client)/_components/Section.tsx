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
			<div className="flex justify-between items-start mb-6">
				{title && <SectionTitle text={title} className="" />}
				{action && <div className="ml-auto">{action}</div>}
			</div>
			{children}
		</section>
	);
}
