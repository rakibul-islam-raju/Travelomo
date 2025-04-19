"use client";

import { AppLoader } from "@/components/AppLoader";
import { NoDataFound } from "@/components/NoDataFound";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useGetVendorEventsPieChartDataQuery } from "@/lib/features/vendor/vendorApi";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import _ from "lodash";
import { CalendarIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { Label, Pie, PieChart } from "recharts";

export const EventPieChart = () => {
	const chartConfig = {
		total_published_events: {
			label: "Published Events",
			color: "hsl(var(--chart-1))",
		},
		total_draft_events: {
			label: "Draft Events",
			color: "hsl(var(--chart-2))",
		},
		total_completed_events: {
			label: "Completed Events",
			color: "hsl(var(--chart-3))",
		},
		total_cancelled_events: {
			label: "Cancelled Events",
			color: "hsl(var(--chart-4))",
		},
		total_archived_events: {
			label: "Archived Events",
			color: "hsl(var(--chart-5))",
		},
	} satisfies ChartConfig;

	const [date, setDate] = useState<DateRange>({
		from: subDays(new Date(), 7),
		to: new Date(),
	});

	const {
		data: eventData,
		isLoading,
		error,
	} = useGetVendorEventsPieChartDataQuery(
		{
			start_date: format(date?.from!, "yyyy-MM-dd"),
			end_date: format(date?.to!, "yyyy-MM-dd"),
		},
		{
			skip: !date,
		}
	);

	const chartData = useMemo(() => {
		return eventData
			? Object.keys(eventData).map((key) => ({
					event: _.startCase(key),
					count: eventData[key],
			  }))
			: [];
	}, [eventData]);

	const totalEvents = useMemo(() => {
		if (!eventData) return 0;
		return Object.values(eventData).reduce((total, count) => total + count, 0);
	}, [eventData]);

	const renderContent = () => {
		if (isLoading) return <AppLoader />;
		if (totalEvents === 0) return <NoDataFound />;
		return (
			<PieChart>
				<ChartTooltip
					cursor={false}
					content={<ChartTooltipContent hideLabel />}
				/>
				<Pie
					data={chartData}
					dataKey="count"
					nameKey="event"
					innerRadius={60}
					strokeWidth={5}
				>
					<Label
						content={({ viewBox }) => {
							if (viewBox && "cx" in viewBox && "cy" in viewBox) {
								return (
									<text
										x={viewBox.cx}
										y={viewBox.cy}
										textAnchor="middle"
										dominantBaseline="middle"
									>
										<tspan
											x={viewBox.cx}
											y={viewBox.cy}
											className="fill-foreground text-3xl font-bold"
										>
											{totalEvents?.toLocaleString()}
										</tspan>
										<tspan
											x={viewBox.cx}
											y={(viewBox.cy || 0) + 24}
											className="fill-muted-foreground"
										>
											Events
										</tspan>
									</text>
								);
							}
						}}
					/>
				</Pie>
			</PieChart>
		);
	};

	return (
		<Card className="">
			<CardHeader>
				<CardTitle>
					<div className="flex flex-wrap gap-2 items-center justify-between">
						<span>Total Events</span>
						<div className={cn("grid gap-2")}>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										id="date"
										variant={"outline"}
										className={cn(
											"text-sm justify-start text-left font-normal",
											!date && "text-muted-foreground"
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
										onSelect={(range) => setDate(range as DateRange)}
										numberOfMonths={2}
									/>
								</PopoverContent>
							</Popover>
						</div>
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent className="flex-1 pb-0">
				<ChartContainer
					config={chartConfig}
					className="mx-auto aspect-square max-h-[250px]"
				>
					{renderContent()}
				</ChartContainer>
			</CardContent>
		</Card>
	);
};
