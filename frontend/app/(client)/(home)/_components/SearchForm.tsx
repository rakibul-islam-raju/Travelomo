"use client";

import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { addDays } from "date-fns";
import { useState } from "react";
import { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Armchair, Calendar as CalendarIcon, LocateIcon } from "lucide-react";

export default function SearchForm() {
	const [date, setDate] = useState<DateRange | undefined>({
		from: addDays(new Date(), 1),
		to: addDays(new Date(), 7),
	});

	return (
		<div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-100">
			<div className="flex flex-col gap-4">
				{/* First Row */}
				<div className="flex items-stretch gap-4">
					{/* Date Range Picker */}
					<div className="flex-1">
						<div className={cn("grid gap-2")}>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										id="date"
										variant={"outline"}
										className={cn(
											"w-full justify-start text-left font-normal h-14",
											!date && "text-muted-foreground"
										)}
									>
										<CalendarIcon className="mr-3 h-5 w-5 shrink-0" />
										{date?.from ? (
											date.to ? (
												<>
													{format(date.from, "MMM d")} -{" "}
													{format(date.to, "MMM d, yyyy")}
												</>
											) : (
												format(date.from, "MMM d, yyyy")
											)
										) : (
											<span>Select dates</span>
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										initialFocus
										mode="range"
										defaultMonth={date?.from}
										selected={date}
										onSelect={setDate}
										numberOfMonths={2}
										className="rounded-lg border shadow-lg"
									/>
								</PopoverContent>
							</Popover>
						</div>
					</div>

					{/* Guests Select */}
					<div className="relative flex-1">
						<Armchair className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
						<Select>
							<SelectTrigger className="h-14 pl-10">
								<SelectValue placeholder="Guests" />
							</SelectTrigger>
							<SelectContent>
								{Array.from({ length: 10 }).map((_, index) => (
									<SelectItem
										key={index}
										value={(index + 1).toString()}
										className="cursor-pointer hover:bg-gray-50"
									>
										{index + 1} {index === 0 ? "Guest" : "Guests"}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Second Row - Location */}
				<div className="relative">
					<LocateIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Where to?"
						className="h-14 pl-10 w-full"
					/>
				</div>

				{/* Third Row - Search Button */}
				<Button className="h-14 px-8 text-base font-medium w-full">
					Search
				</Button>
			</div>
		</div>
	);
}
