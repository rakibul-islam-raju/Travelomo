"use client";

import { cn } from "@/lib/utils";
import { Plus, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import Spinner from "./Spinner";
import { Button } from "./ui/button";

export const AddButton = ({ href, text }: { href: string; text?: string }) => {
	const router = useRouter();

	return (
		<Button onClick={() => router.push(href)}>
			<Plus /> {text}
		</Button>
	);
};

export const RefreshButton = ({
	refetch,
	isRefetching,
}: {
	refetch: () => void;
	isRefetching?: boolean;
}) => {
	return (
		<Button
			variant="outline"
			onClick={() => refetch()}
			disabled={isRefetching}
			title="Refresh"
		>
			<RefreshCcw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
		</Button>
	);
};

export const LoaderButton = ({
	text = "Save",
	type = "button",
	isLoading,
	onClick,
}: {
	text?: string;
	isLoading: boolean;
	type?: "button" | "submit" | "reset";
	onClick?: () => void;
}) => {
	return (
		<Button
			variant="default"
			onClick={() => onClick && onClick()}
			disabled={isLoading}
			type={type}
		>
			{text} {isLoading && <Spinner />}
		</Button>
	);
};
