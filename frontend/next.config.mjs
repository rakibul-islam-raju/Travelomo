/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{ hostname: "picsum.photos" },
			{ hostname: "via.placeholder.com" },
		],
	},
};

export default nextConfig;
