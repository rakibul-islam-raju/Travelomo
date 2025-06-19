import { z } from "zod";

export const STATUS_CHOICES = [
	"draft",
	"published",
	"paused",
	"cancelled",
	"completed",
] as const;

export const eventSchema = z.object({
	title: z.string().trim().min(1, "Title is required").max(100),
	slug: z.string().optional(),
	description: z.string().min(1),
	start_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
		message: "Invalid start date",
	}),
	end_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
		message: "Invalid end date",
	}),
	location: z.string().min(1).max(100),
	total_seats: z.number().int().nonnegative().max(32767),
	available_seats: z.number().int().nonnegative().max(32767),
	actual_price: z.coerce.number(),
	discount_price: z.coerce.number().nullable().optional(),
	features: z.array(z.string()).nullable().optional(),
	tags: z.string().max(255).nullable().optional(),
	status: z.enum(STATUS_CHOICES),
});

export type EventFormValues = z.infer<typeof eventSchema>;

export const defaultLoginValues: EventFormValues = {
	title: "",
	slug: "",
	description: "",
	start_date: "2025-06-20",
	end_date: "2025-06-20",
	location: "",
	total_seats: 0,
	available_seats: 0,
	actual_price: 0,
	discount_price: null,
	features: [],
	tags: "",
	status: "draft",
};
