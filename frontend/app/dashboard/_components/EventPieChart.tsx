"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Calendar } from "lucide-react";
import { useMemo } from "react";
import { Label, Pie, PieChart } from "recharts";

export const EventPieChart = () => {
	const data = [
		{ browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
		{ browser: "safari", visitors: 200, fill: "var(--color-safari)" },
		{ browser: "firefox", visitors: 287, fill: "var(--color-firefox)" },
		{ browser: "edge", visitors: 173, fill: "var(--color-edge)" },
		{ browser: "other", visitors: 190, fill: "var(--color-other)" },
	];

	const chartConfig = {
		visitors: {
			label: "Visitors",
		},
		chrome: {
			label: "Chrome",
			color: "hsl(var(--chart-1))",
		},
		safari: {
			label: "Safari",
			color: "hsl(var(--chart-2))",
		},
		firefox: {
			label: "Firefox",
			color: "hsl(var(--chart-3))",
		},
		edge: {
			label: "Edge",
			color: "hsl(var(--chart-4))",
		},
		other: {
			label: "Other",
			color: "hsl(var(--chart-5))",
		},
	} satisfies ChartConfig;
	const totalVisitors = useMemo(() => {
		return data.reduce((acc, curr) => acc + curr.visitors, 0);
	}, []);

	return (
		<Card className="">
			<CardHeader>
				<CardTitle>
					<div className="flex items-center justify-between">
						<span>Total Events</span>
						<Button variant="outline" size="icon">
							<Calendar />
						</Button>
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent className="flex-1 pb-0">
				<ChartContainer
					config={chartConfig}
					className="mx-auto aspect-square max-h-[250px]"
				>
					<PieChart>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
						/>
						<Pie
							data={data}
							dataKey="visitors"
							nameKey="browser"
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
													{totalVisitors.toLocaleString()}
												</tspan>
												<tspan
													x={viewBox.cx}
													y={(viewBox.cy || 0) + 24}
													className="fill-muted-foreground"
												>
													Visitors
												</tspan>
											</text>
										);
									}
								}}
							/>
						</Pie>
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
};
