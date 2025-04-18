import dayjs from "dayjs";

export const getDateRange = (
	type: string
): { start_date: string; end_date: string } => {
	const now = dayjs();
	let start_date: string = "";
	let end_date: string = "";

	switch (type) {
		case "last_7_days":
			start_date = now.subtract(7, "day").format("YYYY-MM-DD");
			end_date = now.format("YYYY-MM-DD");
			break;
		case "this_week":
			start_date = now.startOf("week").format("YYYY-MM-DD");
			end_date = now.endOf("week").format("YYYY-MM-DD");
			break;
		case "last_30_days":
			start_date = now.subtract(30, "day").format("YYYY-MM-DD");
			end_date = now.format("YYYY-MM-DD");
			break;
		case "this_month":
			start_date = now.startOf("month").format("YYYY-MM-DD");
			end_date = now.endOf("month").format("YYYY-MM-DD");
			break;
		case "last_year":
			start_date = now.subtract(1, "year").format("YYYY-MM-DD");
			end_date = now.format("YYYY-MM-DD");
			break;
		case "this_year":
			start_date = now.startOf("year").format("YYYY-MM-DD");
			end_date = now.endOf("year").format("YYYY-MM-DD");
			break;
		default:
			break;
	}

	return {
		start_date,
		end_date,
	};
};
