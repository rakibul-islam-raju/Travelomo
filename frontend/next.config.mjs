/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{ hostname: "picsum.photos" },
			{ hostname: "via.placeholder.com" },
			{ hostname: "placehold.co" },
			{ hostname: "localhost" },
		],
	},
};

export default nextConfig;
