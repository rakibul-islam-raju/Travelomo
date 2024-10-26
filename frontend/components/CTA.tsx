import { Button } from "./ui/button";

type Props = {
	title: string;
	description: string;
	buttonText: string;
};

export default function CTA({
	title,
	description,
	buttonText = "Explore More",
}: Props) {
	return (
		<div className="bg-primary/10 text-primary p-6 rounded-lg max-w-3xl mx-auto text-center">
			<h2 className="text-3xl font-semibold mb-4">{title}</h2>
			<p className="text-muted-foreground mb-4">{description}</p>
			<div className="flex justify-center">
				<Button className=" mt-4 p-6 text-lg">{buttonText}</Button>
			</div>
		</div>
	);
}
