"use client";

import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { ListFilter } from "lucide-react";

interface FilterDrawerProps {
	children: React.ReactNode;
}

export const FilterDrawer = ({ children }: FilterDrawerProps) => {
	const isMobile = useIsMobile();

	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="outline" className="gap-2">
					<ListFilter className="w-4 h-4" />
					<span>Filter</span>
				</Button>
			</SheetTrigger>

			<SheetContent
				side={isMobile ? "bottom" : "right"}
				className={cn("flex flex-col", {
					"h-screen w-[350px]": !isMobile,
				})}
			>
				<SheetHeader className="border-b pb-2">
					<div className="flex justify-between items-center">
						<SheetTitle>Filters</SheetTitle>
					</div>
					<SheetDescription>
						Customize your search by applying filters
					</SheetDescription>
				</SheetHeader>

				<div className="flex-1 overflow-y-auto px-1 flex flex-col justify-between">
					{children}
				</div>
			</SheetContent>
		</Sheet>
	);
};
