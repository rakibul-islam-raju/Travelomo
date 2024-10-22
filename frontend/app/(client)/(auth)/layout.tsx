export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-[70dvh] flex justify-center items-center">
			<div className="w-full md:w-[550px] mx-auto py-12 ">{children}</div>
		</div>
	);
}
