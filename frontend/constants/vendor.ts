export enum LeadSource {
	REFERRAL = "referral",
	SOCIAL_MEDIA = "social_media",
	SEARCH_ENGINE = "search_engine",
	WEBSITE = "website",
	OTHER = "other",
}

export const leadSourceOptions = [
	{ label: "Referral", value: LeadSource.REFERRAL },
	{ label: "Social Media", value: LeadSource.SOCIAL_MEDIA },
	{ label: "Search Engine", value: LeadSource.SEARCH_ENGINE },
	{ label: "Website", value: LeadSource.WEBSITE },
	{ label: "Other", value: LeadSource.OTHER },
];
