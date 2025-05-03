"use server";

export async function logoutAction() {
	await fetch("/api/auth/logout", {
		method: "POST",
	});
}
