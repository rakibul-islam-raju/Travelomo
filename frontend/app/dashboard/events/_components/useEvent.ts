"use client";

import { useZodForm } from "@/hooks/useZodForm";
import { eventServices } from "@/services/eventService";
import { ICreateEvent } from "@/types/event.types";
import { formatDateYMD } from "@/utils/dateTimes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
	defaultEventValues,
	EventFormValues,
	eventSchema,
} from "../create-event/components/schema";

type UseEventProps = {
	eventId?: string;
	fetchEvents?: boolean;
	filters?: {
		[key: string]: string;
	};
};

export default function useEvent({
	eventId,
	filters,
	fetchEvents = false,
}: UseEventProps) {
	const router = useRouter();
	const queryClient = useQueryClient();

	const [description, setDescription] = useState<string>("");

	const form = useZodForm(eventSchema, {
		defaultValues: defaultEventValues,
		mode: "onChange",
	});

	// Fetch events
	const {
		data: events,
		isFetching: fetchingEvents,
		isRefetching: refreshingEvents,
		refetch: refetchEvents,
	} = useQuery({
		queryKey: ["Events", { filters }],
		queryFn: () => {
			return eventServices.getEventsForVendor(filters);
		},
		enabled: fetchEvents,
		staleTime: 5 * 60 * 1000, // 5min
	});

	// Create event
	const { mutate: createEvent, isPending: creatingEvent } = useMutation({
		mutationFn: (data: ICreateEvent) => eventServices.createEvent(data),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["Events"],
			});
			toast.success("Event created successfully");
			form.reset();
			router.push(`/dashboard/events`);
		},
	});

	// Update event
	const { mutate: updateEvent, isPending: updatingEvent } = useMutation({
		mutationFn: async (data: Partial<ICreateEvent>) => {
			if (!eventId) {
				return;
			}
			return await eventServices.updateEvent(data, eventId);
		},

		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["Events"],
			});
			toast.success("Event updated successfully");
			form.reset();
			router.push(`/dashboard/events`);
		},
	});

	const handleUpdateDescription = (content: string) => {
		form.setValue("description", content);
		setDescription(content);
	};

	const handleSubmit = async (data: EventFormValues) => {
		const postDate: ICreateEvent = {
			...data,
			start_date: formatDateYMD(data.start_date),
			end_date: formatDateYMD(data.start_date),
		};
		if (!eventId) {
			createEvent(postDate);
		} else {
			updateEvent(postDate);
		}
	};

	const handleUpdate = () => {};

	return {
		form,
		description,
		handleUpdateDescription,
		handleSubmit,
		events,
		fetchingEvents,
		refreshingEvents,
		refetchEvents,
		createEvent,
		creatingEvent,
		updateEvent,
		updatingEvent,
	};
}
