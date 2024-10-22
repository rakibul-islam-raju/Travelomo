import React from "react";
import SectionTitle from "./SectionTitle";

type Props = {
	title?: string;
	children: React.ReactNode;
};

export default function Section({ title, children }: Props): React.ReactNode {
	return (
		<section className="py-10">
			{title && <SectionTitle text={title} className="mb-6" />}
			{children}
		</section>
	);
}
