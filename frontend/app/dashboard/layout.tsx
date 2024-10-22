import DashboardHeader from "./_components/DashboardHeader";

export default function DashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<>
			<DashboardHeader />
			<main className="container">{children}</main>
		</>
	);
}
