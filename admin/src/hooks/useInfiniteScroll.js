import { useEffect, useRef } from "react";

const useInfiniteScroll = ({ fetching, fetchData }) => {
	const loaderRef = useRef(null);

	useEffect(() => {
		const observer = new IntersectionObserver((entries) => {
			const target = entries[0];
			if (target.isIntersecting && !fetching) {
				fetchData();
			}
		});

		if (loaderRef.current) {
			observer.observe(loaderRef.current);
		}

		return () => {
			if (loaderRef.current) {
				observer.unobserve(loaderRef.current);
			}
		};
	}, [fetchData, fetching]);

	return loaderRef;
};

export default useInfiniteScroll;
