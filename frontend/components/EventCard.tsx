import React from "react";
import Image from "next/image";
import { formatDate } from "@/lib/dates";
import { Button } from "./ui/button";
import { Armchair } from "lucide-react";

type Props = {
	title: string;
	startDate: Date;
	endDate: Date;
	location: string;
	image: string;
	seatAvailable: number;
	price: number;
};

export default function EventCard({
	title,
	startDate,
	endDate,
	image,
	seatAvailable,
	price,
}: Props): React.ReactNode {
	return (
		<div className="rounded-lg overflow-hidden shadow group hover:shadow-md transition-all duration-300 cursor-pointer">
			<div className="relative h-[200px] overflow-hidden">
				<Image
					src={image}
					alt={title}
					layout="fill"
					className=" w-full object-cover group-hover:scale-110 transition-all duration-300 h-[200px]"
				/>
			</div>
			<div className="p-4">
				<h2 className="text-lg font-semibold text-gray-800 mb-2 truncate">
					{title}
				</h2>
				<p className="text-sm text-muted-foreground">
					{formatDate(startDate)} - {formatDate(endDate)}
				</p>
				<div className="flex justify-between items-center mt-2">
					<div className="bg-primary/10 text-primary py-1 px-2 rounded-md text-sm font-semibold">
						{seatAvailable} seats available
					</div>
					<div className="bg-primary/10 text-primary py-1 px-2 rounded-md text-sm font-semibold">
						${price} per seat
					</div>
				</div>
				<Button className="w-full mt-4" variant={"default"}>
					<Armchair className="w-4 h-4 mr-2" />
					Book Now
				</Button>
			</div>
		</div>
	);
}
