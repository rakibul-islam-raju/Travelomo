import { useSelector } from "react-redux";

export default function useAuthUser() {
	const { user } = useSelector((state) => state.auth);

	return user;
}
