export function DashboardPageContainer({
	children,
}: {
	children: React.ReactNode;
}) {
	return <div className="flex flex-col gap-4">{children}</div>;
}

export function DashHeader({ children }: { children: React.ReactNode }) {
	return <div className="flex justify-between py-4">{children}</div>;
}
export function DashTitle({ children }: { children: React.ReactNode }) {
	return <h4 className="text-xl font-semibold">{children}</h4>;
}

export function DashContent({ children }: { children: React.ReactNode }) {
	return <div className="flex flex-col gap-4">{children}</div>;
}

DashboardPageContainer.Header = DashHeader;
DashboardPageContainer.Title = DashTitle;
DashboardPageContainer.Content = DashContent;
