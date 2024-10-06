import { useLazyGetMeQuery } from "@redux/auth/authApi";
import { localStorageService } from "@services/localStorageService";
import { useEffect, useState } from "react";

export default function useAuthCheck() {
	const [getMe] = useLazyGetMeQuery();
	const accessToken = localStorageService.getAuthTokens()?.access;

	const [authChecked, setAuthChecked] = useState(false);

	useEffect(() => {
		const fetchMe = async () => {
			try {
				await getMe().unwrap();
			} catch (err) {
				console.log(err);
			} finally {
				setAuthChecked(true);
			}
		};

		if (accessToken) {
			fetchMe();
		} else {
			setAuthChecked(true);
		}
	}, [accessToken, getMe]);

	return authChecked;
}
