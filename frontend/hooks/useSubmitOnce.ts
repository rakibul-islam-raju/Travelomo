import { useCallback, useRef } from "react";

/**
 * Guards a mutation against double submission. `isPending` only updates after
 * a re-render, so two quick clicks can both start a request; this ref closes
 * that gap. Call `release` when the request settles.
 *
 * @example submitOnce((release) => mutate(undefined, { onSettled: release }))
 */
export function useSubmitOnce() {
	const inFlight = useRef(false);

	return useCallback((start: (release: () => void) => void) => {
		if (inFlight.current) return;
		inFlight.current = true;
		start(() => {
			inFlight.current = false;
		});
	}, []);
}
