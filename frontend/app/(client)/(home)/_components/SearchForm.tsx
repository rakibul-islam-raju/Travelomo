"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
		<div className="bg-emerald-100/60 p-4 rounded shadow">
			<div className="flex flex-col xl:flex-row items-center gap-4">
				{/* Date Range Picker */}
				<div className="w-full xl:w-[350px]">
					<div className={cn("grid gap-2 w-full")}>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									id="date"
									variant={"outline"}
									className={cn(
										"w-full justify-start text-left font-normal p-6 text-lg",
										!date && "text-muted-foreground p-6 text-lg"
									)}
								>
									<CalendarIcon />
									{date?.from ? (
										date.to ? (
											<>
												{format(date.from, "LLL dd, y")} -{" "}
												{format(date.to, "LLL dd, y")}
											</>
										) : (
											format(date.from, "LLL dd, y")
										)
									) : (
										<span>Pick a date</span>
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
								/>
							</PopoverContent>
						</Popover>
					</div>
				</div>

				{/* Location */}
				<div className="relative">
					<LocateIcon className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
					<Input placeholder="Location" className="p-6 pl-12 text-lg" />
				</div>

				{/* Seat for */}
				<div className="relative w-full xl:w-[200px]">
					<Armchair className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
					<Select>
						<SelectTrigger className="p-6 pl-12 text-lg w-full">
							<SelectValue placeholder="Seat for" />
						</SelectTrigger>
						<SelectContent className="w-full">
							{Array.from({ length: 7 }).map((_, index) => (
								<SelectItem key={index} value={(index + 1).toString()}>
									{index + 1} Seat
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="flex justify-end mt-6">
				<Button className="px-10 py-6 text-xl">Search</Button>
			</div>
		</div>
	);
}
