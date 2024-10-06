import { localStorageService } from "@services/localStorageService";

export default function useAuth() {
	const auth = localStorageService.getAuthTokens();

	if (auth?.access) return true;

	return false;
}
