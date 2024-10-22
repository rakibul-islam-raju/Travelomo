import Footer from "@/app/(client)/_components/Footer";
import Header from "@/app/(client)/_components/Header";

export default function ClientLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<>
			<Header />
			<main className="container py-6">{children}</main>
			<Footer />
		</>
	);
}
