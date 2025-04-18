"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectValue,
} from "@/components/ui/select";
import { useGetVendorRegisteredTravelersQuery } from "@/lib/features/vendor/vendorApi";
import { SelectTrigger } from "@radix-ui/react-select";
import { Calendar } from "lucide-react";
import { useState } from "react";

// const chartData = [
// 	{ key: "January", count: 186 },
// 	{ key: "February", count: 305 },
// 	{ key: "March", count: 237 },
// 	{ key: "April", count: 73 },
// 	{ key: "May", count: 209 },
// 	{ key: "June", count: 214 },
// 	{ key: "July", count: 214 },
// 	{ key: "August", count: 214 },
// 	{ key: "September", count: 214 },
// 	{ key: "October", count: 214 },
// 	{ key: "November", count: 214 },
// 	{ key: "December", count: 214 },
// ];

const chartConfig = {
	desktop: {
		label: "Registered Travellers",
		color: "hsl(var(--chart-1))",
	},
} satisfies ChartConfig;

export const RegisteredUserLineChart = () => {
	const [type, setType] = useState("last_7_days");

	const handleTypeChange = (value: string) => {
		setType(value);
	};

	const { data, isLoading } = useGetVendorRegisteredTravelersQuery(type, {
		skip: !type,
	});

	console.log("line data -->", data);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>Registered Travelers</CardTitle>
					<Select onValueChange={handleTypeChange} value={type}>
						<SelectTrigger className="w-[180px] border rounded-lg py-1 px-2 flex items-center gap-2">
							<Calendar className="mr-2 h-4 w-4" />
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectItem value="last_7_days">Last 7 days</SelectItem>
								<SelectItem value="this_week">This week</SelectItem>
								<SelectItem value="last_30_days">Last 30 days</SelectItem>
								<SelectItem value="this_month">This month</SelectItem>
								<SelectItem value="last_year">Last year</SelectItem>
								<SelectItem value="this_year">This year</SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
				<CardDescription>
					Showing registered travellers in any event
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="max-h-[550px] w-full">
					<AreaChart
						accessibilityLayer
						data={data}
						margin={{
							left: 12,
							right: 12,
						}}
					>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="key"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tickFormatter={(value) => value.slice(0, 3)}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator="dot" hideLabel />}
						/>
						<Area
							dataKey="count"
							type="linear"
							fill="var(--color-desktop)"
							fillOpacity={0.4}
							stroke="var(--color-desktop)"
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
};
