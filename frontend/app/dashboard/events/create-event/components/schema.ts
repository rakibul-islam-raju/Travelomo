import { addNDaysToDate } from "@/utils/dateTimes";
import { z } from "zod";

export const STATUS_CHOICES = [
	"draft",
	"published",
	"paused",
	"cancelled",
	"completed",
] as const;

export const eventSchema = z
	.object({
		title: z.string().trim().min(1, "Title is required").max(100),
		slug: z.string().optional(),
		description: z.string().min(1),
		start_date: z.coerce.date(),
		end_date: z.coerce.date(),
		location: z.string().min(1).max(100),
		total_seats: z.coerce.number().int().nonnegative().max(32767),
		actual_price: z.coerce.number().positive(),
		discount_price: z.coerce.number().positive(),
		tags: z.string().max(255).optional(),
		status: z.enum(STATUS_CHOICES),
	})
	.refine((data) => data.discount_price <= data.actual_price, {
		message: "Discount price cannot exceed the actual price.",
		path: ["discount_price"],
	});

export type EventFormValues = z.infer<typeof eventSchema>;

const today = new Date();

export const defaultEventValues: EventFormValues = {
	title: "",
	slug: "",
	description: "",
	start_date: today,
	end_date: addNDaysToDate(today, 7),
	location: "",
	total_seats: 0,
	actual_price: 0,
	discount_price: 0,
	tags: "",
	status: "draft",
};
