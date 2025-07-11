import CtaImage from "@/assets/images/cta.jpg";
import Image from "next/image";
import { Button } from "./ui/button";

type Props = {
	title: string;
	description: string;
	buttonText?: string;
};

export default function CTA({
	title,
	description,
	buttonText = "Explore More",
}: Props) {
	return (
		<section className="">
			<div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-12 bg-white dark:bg-black/10 shadow-xl rounded-3xl min-h-[600px]">
				{/* Image Section */}
				<div className="w-full h-full relative">
					<Image
						src={CtaImage}
						alt={"Travelomo"}
						fill
						className="object-cover object-center rounded-2xl shadow-lg rounded-r-none"
						priority
					/>
				</div>

				{/* Text Section */}
				<div className="text-center md:text-left">
					<span className="inline-block bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full uppercase tracking-wide mb-4">
						{"Smarter Travel Starts Here"}
					</span>

					<h2 className="text-4xl md:text-5xl font-extrabold text-primary mb-4 leading-tight">
						{title}
					</h2>

					<p className="text-muted-foreground text-base md:text-lg mb-8">
						{description}
					</p>

					<div className="flex flex-col sm:flex-row items-center gap-4">
						<Button className="text-base px-6 py-3">{buttonText}</Button>
					</div>
				</div>
			</div>
		</section>
	);
}
