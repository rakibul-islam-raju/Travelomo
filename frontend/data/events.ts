export type Event = {
	id: string | number;
	slug: string;
	title: string;
	startDate: Date;
	endDate: Date;
	location: string;
	image: string;
	seatAvailable: number;
	price: number;
};

export const events: Event[] = [
	{
		id: 1,
		title: "3 Day 2 Night Trip to Dubai",
		startDate: new Date(),
		endDate: new Date(),
		location: "Dubai, UAE",
		image: "https://picsum.photos/200/100?event=1",
		seatAvailable: 100,
		price: 100,
		slug: "3-day-2-night-trip-to-dubai",
	},
	{
		id: 2,
		title: "5 Day 4 Night Trip to Bali",
		startDate: new Date(),
		endDate: new Date(),
		location: "Bali, Indonesia",
		image: "https://picsum.photos/200/100?event=2",
		seatAvailable: 100,
		price: 100,
		slug: "5-day-4-night-trip-to-bali",
	},
	{
		id: 3,
		title: "7 Day 6 Night Trip to Paris",
		startDate: new Date(),
		endDate: new Date(),
		location: "Paris, France",
		image: "https://picsum.photos/200/100?event=3",
		seatAvailable: 100,
		price: 100,
		slug: "7-day-6-night-trip-to-paris",
	},
	{
		id: 4,
		title: "10 Day 9 Night Trip to Tokyo",
		startDate: new Date(),
		endDate: new Date(),
		location: "Tokyo, Japan",
		image: "https://picsum.photos/200/100?event=4",
		seatAvailable: 100,
		price: 100,
		slug: "10-day-9-night-trip-to-tokyo",
	},
	{
		id: 5,
		title: "12 Day 11 Night Trip to London",
		startDate: new Date(),
		endDate: new Date(),
		location: "London, UK",
		image: "https://picsum.photos/200/100?event=5	",
		seatAvailable: 100,
		price: 100,
		slug: "12-day-11-night-trip-to-london",
	},
	{
		id: 6,
		title: "15 Day 14 Night Trip to New York",
		startDate: new Date(),
		endDate: new Date(),
		location: "New York, USA",
		image: "https://picsum.photos/200/100?event=6",
		seatAvailable: 100,
		price: 100,
		slug: "15-day-14-night-trip-to-new-york",
	},
	{
		id: 7,
		title: "18 Day 17 Night Trip to Sydney",
		startDate: new Date(),
		endDate: new Date(),
		location: "Sydney, Australia",
		image: "https://picsum.photos/200/100?event=7",
		seatAvailable: 100,
		price: 100,
		slug: "18-day-17-night-trip-to-sydney",
	},
	{
		id: 8,
		title: "21 Day 20 Night Trip to Spain",
		startDate: new Date(),
		endDate: new Date(),
		location: "Spain",
		image: "https://picsum.photos/200/100?event=8",
		seatAvailable: 100,
		price: 100,
		slug: "21-day-20-night-trip-to-spain",
	},
	{
		id: 9,
		title: "24 Day 23 Night Trip to India",
		startDate: new Date(),
		endDate: new Date(),
		location: "India",
		image: "https://picsum.photos/200/100?event=9",
		seatAvailable: 100,
		price: 100,
		slug: "24-day-23-night-trip-to-india",
	},
	{
		id: 10,
		title: "10 Day 9 Night Trip to America",
		startDate: new Date(),
		endDate: new Date(),
		location: "America",
		image: "https://picsum.photos/200/100?event=10",
		seatAvailable: 100,
		price: 100,
		slug: "10-day-9-night-trip-to-america",
	},
];
