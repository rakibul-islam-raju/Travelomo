"use client";

import { LoaderButton } from "@/components/Buttons";
import { BaseForm } from "@/components/molecules/form/BaseForm";
import { DatePickerField } from "@/components/molecules/form/DatePickerField";
import { SelectField } from "@/components/molecules/form/SelectField";
import { TextField } from "@/components/molecules/form/TextField";
import { RichTextEditor } from "@/components/molecules/RichTextEditor/RichTextEditor";
import { Button } from "@/components/ui/button";
import { IVendorEventDetails } from "@/types/event.types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import slugify from "slugify";
import useEvent from "../../_components/useEvent";
import { EventFormValues } from "./schema";

type Props = {
	data?: IVendorEventDetails;
};

export const EventForm: React.FC<Props> = ({ data }) => {
	const router = useRouter();

	const {
		form,
		description,
		handleUpdateDescription,
		handleSubmit,
		creatingEvent,
	} = useEvent({ eventId: data ? data.id : undefined });

	const title = form.watch("title");

	useEffect(() => {
		if (title) {
			form.setValue("slug", slugify(title));
		}
	}, [title]);

	useEffect(() => {
		if (data && data.status) {
			// Delay reset until fields have mounted
			setTimeout(() => {
				form.reset({
					title: data.title,
					slug: data.slug,
					description: data.description,
					location: data.location,
					start_date: new Date(data.start_date),
					end_date: new Date(data.end_date),
					actual_price: data.actual_price,
					discount_price: data.discount_price,
					total_seats: data.total_seats,
					status: data.status.toLowerCase(),
				});

				handleUpdateDescription(data.description);
			}, 0); // minimal delay to let all fields register
		}
	}, [data]);

	return (
		<div className="max-w-3xl">
			<BaseForm form={form} onSubmit={handleSubmit}>
				<div className="space-y-4">
					<TextField<EventFormValues> name="title" label="title" required />
					<TextField<EventFormValues>
						name="slug"
						label="Slug"
						required
						helpText="A slug is the URL-friendly version of the title. It should contain only lowercase letters, numbers, and hyphens. Example: my-awesome-article"
					/>
					<RichTextEditor
						label="Description"
						value={description}
						onChange={handleUpdateDescription}
						required
						className=""
					/>
					<TextField<EventFormValues>
						name="location"
						label="Location"
						required
					/>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<DatePickerField<EventFormValues>
							name={`start_date`}
							label="Start Date"
							required
						/>
						<DatePickerField<EventFormValues>
							name={`end_date`}
							label="End Date"
							required
						/>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<TextField<EventFormValues>
							name="actual_price"
							label="Price Per Seat"
							type="number"
							required
						/>
						<TextField<EventFormValues>
							name="discount_price"
							label="Discount Price Per Seat"
							type="number"
							required
						/>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<TextField<EventFormValues>
							name="total_seats"
							label="Total Seats"
							type="number"
							required
						/>
						<SelectField<EventFormValues>
							name="status"
							label="Status"
							options={[
								{ text: "Draft", value: "draft" },
								{ text: "Publish", value: "published" },
							]}
							required
						/>
					</div>

					<div className="flex justify-end gap-2">
						<Button
							variant={"outline"}
							type="button"
							onClick={() =>
								router.push(
									data ? `/dashboard/events/${data.id}` : "/dashboard/events"
								)
							}
						>
							Cancel
						</Button>
						<LoaderButton text="Save" type="submit" isLoading={creatingEvent} />
					</div>
				</div>
			</BaseForm>
		</div>
	);
};
