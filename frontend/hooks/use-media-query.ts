import * as React from "react";

// shadcn's default breakpoints
const breakpoints = {
	sm: 640,
	md: 768,
	lg: 1024,
	xl: 1280,
	"2xl": 1536,
} as const;

type Breakpoint = keyof typeof breakpoints;

export function useMediaQuery(breakpoint: Breakpoint | number) {
	const [matches, setMatches] = React.useState<boolean>(false);

	React.useEffect(() => {
		const query =
			typeof breakpoint === "number"
				? `(min-width: ${breakpoint}px)`
				: `(min-width: ${breakpoints[breakpoint]}px)`;

		const media = window.matchMedia(query);

		// Set initial value
		setMatches(media.matches);

		// Create event listener
		const listener = (event: MediaQueryListEvent) => {
			setMatches(event.matches);
		};

		// Add listener
		media.addEventListener("change", listener);

		// Clean up
		return () => {
			media.removeEventListener("change", listener);
		};
	}, [breakpoint]);

	return matches;
}

// Convenience hooks for common breakpoints
export function useIsMobile() {
	const isMd = useMediaQuery("md");
	return !isMd;
}

export function useIsTablet() {
	const isMd = useMediaQuery("md");
	const isLg = useMediaQuery("lg");
	return isMd && !isLg;
}

export function useIsDesktop() {
	return useMediaQuery("lg");
}

export function useIsLargeDesktop() {
	return useMediaQuery("xl");
}
