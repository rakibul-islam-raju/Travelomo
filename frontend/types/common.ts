export type AuthTokens = {
	access: string;
	refresh: string;
};

export interface GenericListResponse<T> {
	count: number;
	results: T[];
	next: string;
	previous: string;
}

export interface GenericListParams {
	limit?: number;
	offset?: number;
	search?: string;
}
