import dayjs from "dayjs";

export const formatDate = (date) => {
	return dayjs(date).format("DD MMM, YYYY");
};

export const formatPostDate = (date) => {
	return dayjs(date).format("YYYY-MM-DD");
};
