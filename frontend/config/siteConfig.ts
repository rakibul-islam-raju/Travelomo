export const siteConfig = {
	name: "Travel More",
	subtitle: "Explore the beauty of nature and culture",
	url: "https://travelmore.com",
	ogImage: "https://travelmore.com/og.png",
	description:
		"Travel More is a platform for finding tour events and activities.",
	links: {
		twitter: "https://twitter.com/travelmore",
		facebook: "https://facebook.com/travelmore",
		instagram: "https://instagram.com/travelmore",
		linkedin: "https://linkedin.com/company/travelmore",
	},
	email: "info@travelmore.com",
	phone: "+8801712345678",
};

export const BASE_API_URL: string =
	process.env.BASE_API_URL || "http://localhost:8000/api/v1";
export const RESULT_PER_PAGE: number = 12;
