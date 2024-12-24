import _ from "lodash";
import { useEffect, useMemo, useState } from "react";

const useSearch = (initialSearch = null, updateParams) => {
	const [searchText, setSearchText] = useState(initialSearch);

	const onChange = (e) => setSearchText(e.target.value);

	// Memoize the debounced function to avoid recreating it on each render
	const debouncedSearch = useMemo(
		() =>
			_.debounce((term) => {
				updateParams(term?.trim === "" ? { offset: 0 } : { search: term });
			}, 500),
		[searchText] // Only change when searchText changes
	);

	useEffect(() => {
		// Call the debounced function whenever searchText changes
		debouncedSearch(searchText);

		// Clean up: cancel the debounced function on unmount or before the next invocation
		return () => {
			debouncedSearch.cancel();
		};
	}, [searchText, debouncedSearch]); // Only re-run when searchText changes

	return {
		searchText,
		setSearchText,
		onChange,
	};
};

export default useSearch;
