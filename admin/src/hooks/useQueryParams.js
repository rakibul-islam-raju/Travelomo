/* eslint-disable no-unused-vars */
import { useState } from "react";

export const useQueryParams = (initialParams) => {
	const [qParams, setQParams] = useState(initialParams);

	// Update function to modify search params
	const updateParams = (newParams) => {
		if (!newParams || typeof newParams !== "object") {
			console.error("Invalid parameters provided.");
			return;
		}

		// Check if all values in newParams are null or undefined
		const hasNonNullValues = Object.values(newParams).some(
			(value) => value != null
		);

		if (!hasNonNullValues) {
			// If all values are null or undefined, don't update the state
			return;
		}

		setQParams((prevParams) => {
			return Object.keys(newParams).reduce(
				(updatedParams, key) => {
					// If the new value is null or undefined, remove the key from params
					if (newParams[key] == null) {
						const { [key]: _, ...rest } = updatedParams;
						return rest;
					}
					// Otherwise, update the params
					return {
						...updatedParams,
						[key]: newParams[key],
					};
				},
				{ ...prevParams }
			);
		});
	};

	return {
		qParams,
		updateParams,
	};
};
