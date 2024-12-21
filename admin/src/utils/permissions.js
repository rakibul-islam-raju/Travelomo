export const isSuperUser = (user) => {
	return user?.role === "admin" && user?.is_superuser;
};
