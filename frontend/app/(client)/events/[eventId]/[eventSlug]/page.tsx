import Divider from "@/components/Divider";
import { Button } from "@/components/ui/button";
import { Armchair, ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function EventDetailsPage() {
	return (
		<>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* left */}
				<div className="order-2 md:order-1">
					<div className="flex gap-2">
						<Link href="/">
							<Button
								variant="ghost"
								size="sm"
								className="text-muted-foreground bg-muted-foreground/10"
							>
								<ChevronLeft />
							</Button>
						</Link>
						<h1 className="text-2xl font-bold">
							7 Night and 8 Day Tour of the Philippines
						</h1>
					</div>

					<Divider />

					<p className="">
						Lorem ipsum dolor sit amet consectetur, adipisicing elit. Quo,
						tempore nostrum cupiditate beatae explicabo quis aliquid vel, ex
						necessitatibus saepe voluptate in iste quibusdam fuga corporis atque
						perspiciatis blanditiis pariatur porro nulla dicta! Nesciunt
						molestiae consequuntur tenetur nostrum, amet distinctio veritatis
						dignissimos. Repellat libero ipsam magni alias molestiae quos nam.
					</p>

					<Divider />

					<h2 className="text-xl font-semibold mt-4 mb-2">Tour Highlights</h2>
					<ul className="list-disc list-inside space-y-2">
						<li>Explore the pristine beaches of Boracay</li>
						<li>Visit the historic Intramuros in Manila</li>
						<li>Discover the underground river in Palawan</li>
						<li>Experience the vibrant nightlife in Cebu City</li>
						<li>Hike the Chocolate Hills in Bohol</li>
					</ul>

					<Divider />

					<h2 className="text-xl font-semibold mt-4 mb-2">Itinerary</h2>
					<div className="space-y-4">
						<div>
							<h3 className="font-medium">Day 1-2: Manila</h3>
							<p>
								Arrive in Manila. City tour including Intramuros and Rizal Park.
							</p>
						</div>
						<div>
							<h3 className="font-medium">Day 3-4: Boracay</h3>
							<p>Fly to Boracay. Beach activities and island hopping.</p>
						</div>
						<div>
							<h3 className="font-medium">Day 5-6: Palawan</h3>
							<p>
								Fly to Palawan. Underground River tour and island exploration.
							</p>
						</div>
						<div>
							<h3 className="font-medium">Day 7-8: Cebu</h3>
							<p>
								Fly to Cebu. City tour, optional day trip to Bohol, departure.
							</p>
						</div>
					</div>

					<Divider />

					<div className="mt-4">
						<h2 className="text-xl font-semibold mb-2">Tour Details</h2>
						<p>
							<strong>Duration:</strong> 8 days, 7 nights
						</p>
						<p>
							<strong>Group Size:</strong> Maximum 12 people
						</p>
						<p>
							<strong>Included:</strong> Accommodation, domestic flights, guided
							tours, some meals
						</p>
						<p>
							<strong>Not Included:</strong> International flights, travel
							insurance, personal expenses
						</p>
					</div>
				</div>

				{/* right */}
				<div className="order-1 md:order-2">
					<div className="relative h-[600px] overflow-hidden">
						<Image
							src="https://picsum.photos/id/10/1024/768"
							fill
							className="object-cover rounded"
							alt="Event 1"
						/>
					</div>

					<div className="flex mt-6 gap-2">
						<Button className="w-full ">
							<Armchair className="w-4 h-4 mr-2" />
							Book Now
						</Button>
					</div>
				</div>
			</div>
		</>
	);
}
