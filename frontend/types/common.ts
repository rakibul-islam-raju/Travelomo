export type AuthTokens = {
	access: string;
	refresh: string;
};

export type GenericListResponse<T> = {
	count: number;
	results: T[];
	next: string;
	previous: string;
};
