"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { AppLoader } from "@/components/AppLoader";
import { NoDataFound } from "@/components/NoDataFound";
import { Button } from "@/components/ui/button";
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
import { vendorStatService } from "@/services/vendorStatService";
import { SelectTrigger } from "@radix-ui/react-select";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { useState } from "react";

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

	const { data, isFetching } = useQuery({
		queryKey: ["VendorRegisteredTravelers"],
		queryFn: () => vendorStatService.getVendorRegisteredTravelers(type),
		enabled: !!type,
	});

	let content: React.ReactNode = <NoDataFound />;

	if (isFetching) {
		content = <AppLoader />;
	}
	if (data?.length) {
		content = (
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
		);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>Registered Travelers</CardTitle>
					<Select onValueChange={handleTypeChange} value={type}>
						<SelectTrigger asChild className="">
							<Button variant="outline">
								<Calendar className="mr-2 h-4 w-4" />
								<SelectValue />
							</Button>
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
					{content}
				</ChartContainer>
			</CardContent>
		</Card>
	);
};
