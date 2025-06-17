export function getFirstTwoCharOfFullName(fullName: string): string {
	const parts = fullName.trim().split(/\s+/);
	const first = parts[0]?.charAt(0) || "";
	const second = parts[1]?.charAt(0) || "";
	return [first, second].filter(Boolean).join("");
}
