"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bookingServices } from "@/services/bookingService";
import { BookingStatus, IVendorBooking } from "@/types/booking.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/dates";
import {
	AlertCircle,
	CheckCircle2,
	Clock3,
	Copy,
	Mail,
	ReceiptText,
	Ticket,
	User,
	XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { NoDataFound } from "../../_components/NoDataFound";

type Filter = "all" | "needs_review" | "confirmed" | "closed";

const statusClass: Record<BookingStatus, string> = {
	awaiting_payment_reference: "bg-amber-50 text-amber-800 border-amber-200",
	pending_verification: "bg-blue-50 text-blue-800 border-blue-200",
	confirmed: "bg-green-50 text-green-800 border-green-200",
	payment_rejected: "bg-red-50 text-red-800 border-red-200",
	expired: "bg-gray-100 text-gray-700 border-gray-200",
	cancelled: "bg-gray-100 text-gray-700 border-gray-200",
};

function formatMoney(amount: string, currency: string) {
	return new Intl.NumberFormat("en-BD", { style: "currency", currency }).format(
		Number(amount)
	);
}

export default function VendorBookingList() {
	const queryClient = useQueryClient();
	const [filter, setFilter] = useState<Filter>("all");
	const [review, setReview] = useState<{
		booking: IVendorBooking;
		action: "approve" | "reject";
	} | null>(null);
	const [reason, setReason] = useState("");

	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ["VendorBookings"],
		queryFn: () => bookingServices.getVendorBookings(),
		refetchInterval: 60_000,
	});

	const { mutate: submitReview, isPending: reviewing } = useMutation({
		mutationFn: () =>
			bookingServices.reviewPayment(review!.booking.id, {
				action: review!.action,
				reason: reason.trim(),
			}),
		onSuccess: (updated) => {
			toast.success(
				updated.status === "confirmed"
					? "Payment verified and seats confirmed"
					: "Payment rejected and seats released"
			);
			setReview(null);
			setReason("");
			queryClient.invalidateQueries({ queryKey: ["VendorBookings"] });
			queryClient.invalidateQueries({ queryKey: ["VendorSummaryInfo"] });
		},
	});

	const bookings = data?.results ?? [];
	const pendingCount = bookings.filter(
		(booking) => booking.status === "pending_verification"
	).length;
	const visibleBookings = useMemo(() => {
		if (filter === "needs_review") {
			return bookings.filter((booking) => booking.status === "pending_verification");
		}
		if (filter === "confirmed") {
			return bookings.filter((booking) => booking.status === "confirmed");
		}
		if (filter === "closed") {
			return bookings.filter((booking) =>
				["payment_rejected", "expired", "cancelled"].includes(booking.status)
			);
		}
		return bookings;
	}, [bookings, filter]);

	const copyTransaction = async (transactionId: string) => {
		await navigator.clipboard.writeText(transactionId);
		toast.success("Transaction ID copied");
	};

	if (isLoading) {
		return (
			<div className="space-y-3">
				{[...Array(4)].map((_, index) => (
					<div key={index} className="h-40 animate-pulse rounded-xl border bg-muted/50" />
				))}
			</div>
		);
	}

	if (isError) {
		return (
			<div className="rounded-xl border border-destructive/30 p-8 text-center">
				<AlertCircle className="mx-auto h-8 w-8 text-destructive" />
				<p className="mt-3 font-semibold">Bookings could not be loaded</p>
				<Button className="mt-4" variant="outline" onClick={() => refetch()}>Try again</Button>
			</div>
		);
	}

	if (bookings.length === 0) return <NoDataFound />;

	return (
		<div className="space-y-5">
			<div className="rounded-2xl border bg-gradient-to-r from-primary/10 via-background to-background p-5">
				<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
					<div>
						<p className="text-sm font-medium text-primary">Payment review queue</p>
						<h2 className="mt-1 text-xl font-bold">
							{pendingCount === 0
								? "You're all caught up"
								: `${pendingCount} payment${pendingCount === 1 ? "" : "s"} waiting`}
						</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Check the transaction in your payment account before approving.
						</p>
					</div>
					<Clock3 className="h-10 w-10 text-primary/60" />
				</div>
			</div>

			<div className="flex flex-wrap gap-2">
				{([
					["all", `All (${bookings.length})`],
					["needs_review", `Needs review (${pendingCount})`],
					["confirmed", "Confirmed"],
					["closed", "Closed"],
				] as [Filter, string][]).map(([value, label]) => (
					<Button
						key={value}
						size="sm"
						variant={filter === value ? "default" : "outline"}
						onClick={() => setFilter(value)}
					>
						{label}
					</Button>
				))}
			</div>

			<div className="space-y-3">
				{visibleBookings.map((booking) => (
					<article key={booking.id} className="rounded-2xl border bg-card p-5 shadow-sm">
						<div className="flex flex-col justify-between gap-4 lg:flex-row">
							<div className="min-w-0 space-y-3">
								<div className="flex flex-wrap items-center gap-2">
									<h3 className="font-semibold">{booking.event_title}</h3>
									<Badge variant="outline" className={statusClass[booking.status]}>
										{booking.status_label}
									</Badge>
								</div>
								<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
									{booking.booking_reference} · submitted {formatDate(booking.created_at)}
								</p>
								<div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
									<span className="flex items-center gap-1.5"><User className="h-4 w-4" />{booking.user_name}</span>
									<span className="flex items-center gap-1.5"><Mail className="h-4 w-4" />{booking.user_email}</span>
									<span className="flex items-center gap-1.5"><Ticket className="h-4 w-4" />{booking.seat_number} seat{booking.seat_number > 1 ? "s" : ""}</span>
								</div>
							</div>

							<div className="flex min-w-[250px] flex-col gap-3 rounded-xl bg-muted/50 p-4">
								<div className="flex justify-between gap-4">
									<span className="text-sm text-muted-foreground">Expected amount</span>
									<span className="font-bold">{formatMoney(booking.total_price, booking.currency)}</span>
								</div>
								{booking.payment_submission ? (
									<>
										<div className="flex justify-between gap-4 text-sm">
											<span className="text-muted-foreground">Method</span>
											<span className="font-medium">{booking.payment_submission.payment_method_name}</span>
										</div>
										<div className="flex items-center justify-between gap-4 text-sm">
											<span className="text-muted-foreground">Transaction ID</span>
											<span className="flex items-center gap-1 font-mono font-semibold">
												{booking.payment_submission.transaction_id}
												<Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyTransaction(booking.payment_submission!.transaction_id)} aria-label="Copy transaction ID"><Copy className="h-3.5 w-3.5" /></Button>
											</span>
										</div>
									</>
								) : (
									<p className="flex items-center gap-2 text-sm text-amber-700"><ReceiptText className="h-4 w-4" />Waiting for customer transaction ID</p>
								)}

								{booking.status === "pending_verification" && (
									<div className="mt-1 grid grid-cols-2 gap-2">
										<Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => { setReason(""); setReview({ booking, action: "reject" }); }}><XCircle className="mr-1.5 h-4 w-4" />Reject</Button>
										<Button onClick={() => setReview({ booking, action: "approve" })}><CheckCircle2 className="mr-1.5 h-4 w-4" />Approve</Button>
									</div>
								)}
								{booking.payment_submission?.rejection_reason && (
									<p className="text-sm text-destructive">Reason: {booking.payment_submission.rejection_reason}</p>
								)}
							</div>
						</div>
					</article>
				))}
				{visibleBookings.length === 0 && (
					<div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">No bookings match this filter.</div>
				)}
			</div>

			<Dialog open={!!review} onOpenChange={(open) => !open && setReview(null)}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{review?.action === "approve" ? "Confirm this payment?" : "Why are you rejecting it?"}</DialogTitle>
					</DialogHeader>
					{review && (
						<div className="space-y-4 py-2">
							<div className="rounded-xl bg-muted p-4 text-sm">
								<div className="flex justify-between"><span className="text-muted-foreground">Transaction</span><span className="font-mono font-semibold">{review.booking.payment_submission?.transaction_id}</span></div>
								<div className="mt-2 flex justify-between"><span className="text-muted-foreground">Expected amount</span><span className="font-bold">{formatMoney(review.booking.total_price, review.booking.currency)}</span></div>
							</div>
							{review.action === "approve" ? (
								<p className="text-sm text-muted-foreground">Approve only after finding this exact transaction in your payment account. The customer&apos;s seats will become confirmed.</p>
							) : (
								<div className="space-y-2"><Label htmlFor="rejection-reason">Reason for the customer</Label><Input id="rejection-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Example: Transaction ID was not found" /><p className="text-xs text-muted-foreground">The held seats will be released immediately.</p></div>
							)}
						</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => setReview(null)}>Go back</Button>
						<Button variant={review?.action === "reject" ? "destructive" : "default"} disabled={reviewing || (review?.action === "reject" && reason.trim().length < 3)} onClick={() => submitReview()}>{reviewing ? "Saving..." : review?.action === "approve" ? "Yes, confirm seats" : "Reject & release seats"}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
