"use client";

import { BaseForm } from "@/components/molecules/form/BaseForm";
import { DatePickerField } from "@/components/molecules/form/DatePickerField";
import { TextField } from "@/components/molecules/form/TextField";
import { Button } from "@/components/ui/button";
import { IEventFilter } from "@/types/event.types";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

type Props = {
	filters: IEventFilter;
	handleUpdateFilters: (params: IEventFilter) => void;
};

export const EventFilter: React.FC<Props> = ({
	filters,
	handleUpdateFilters,
}) => {
	const form = useForm<IEventFilter>({
		defaultValues: {
			available_seats: "",
		},
	});

	const applyFilter = () => {
		handleUpdateFilters(form.getValues());
	};

	const handleReset = () => {
		form.reset();
		handleUpdateFilters(form.getValues());
	};

	useEffect(() => {
		form.reset(filters);
	}, []);

	return (
		<>
			<BaseForm form={form} onSubmit={applyFilter}>
				<DatePickerField<IEventFilter> name="start_date" label="Start date" />
				<DatePickerField<IEventFilter> name="end_date" label="End date" />
				<TextField<IEventFilter>
					name="start_price"
					label="Start price"
					type="number"
				/>
				<TextField<IEventFilter>
					name="end_price"
					label="End price"
					type="number"
				/>
				<TextField<IEventFilter>
					name="available_seats"
					label="Available seats"
					type="number"
				/>
			</BaseForm>

			<div className="mt-auto flex gap-2 pt-4">
				<Button variant="outline" className="w-full" onClick={handleReset}>
					Reset
				</Button>
				<Button className="w-full" onClick={form.handleSubmit(applyFilter)}>
					Apply Filters
				</Button>
			</div>
		</>
	);
};
