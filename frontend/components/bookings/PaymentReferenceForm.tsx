"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { bookingServices } from "@/services/bookingService";
import { IBooking } from "@/types/booking.types";
import { useMutation } from "@tanstack/react-query";
import {
	Check,
	Clock3,
	Copy,
	ExternalLink,
	ReceiptText,
	ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface PaymentReferenceFormProps {
	booking: IBooking;
	onSubmitted: (booking: IBooking) => void;
	onCancel?: () => void;
	compact?: boolean;
}

function formatMoney(amount: string, currency: string) {
	return new Intl.NumberFormat("en-BD", {
		style: "currency",
		currency,
		maximumFractionDigits: 2,
	}).format(Number(amount));
}

function formatTimeLeft(milliseconds: number) {
	if (milliseconds <= 0) return "Expired";
	const totalSeconds = Math.floor(milliseconds / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function PaymentReferenceForm({
	booking,
	onSubmitted,
	onCancel,
	compact = false,
}: PaymentReferenceFormProps) {
	const methods = booking.payment_methods ?? [];
	const [methodId, setMethodId] = useState(methods[0]?.id ?? "");
	const [transactionId, setTransactionId] = useState("");
	const [now, setNow] = useState(Date.now());

	useEffect(() => {
		const timer = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(timer);
	}, []);

	const selectedMethod = useMemo(
		() => methods.find((method) => method.id === methodId),
		[methodId, methods]
	);
	const expiresAt = booking.payment_reference_expires_at
		? new Date(booking.payment_reference_expires_at).getTime()
		: now;
	const timeLeft = expiresAt - now;
	const hasExpired = timeLeft <= 0;

	const { mutate: submitReference, isPending } = useMutation({
		mutationFn: () =>
			bookingServices.submitPaymentReference(booking.id, {
				payment_method: methodId,
				transaction_id: transactionId.trim(),
			}),
		onSuccess: (updatedBooking) => {
			toast.success("Transaction submitted for verification", {
				description: "The organizer will review it and confirm your seats.",
			});
			onSubmitted(updatedBooking);
		},
	});

	const copyAccountNumber = async () => {
		if (!selectedMethod) return;
		await navigator.clipboard.writeText(selectedMethod.account_number);
		toast.success("Account number copied");
	};

	if (methods.length === 0) {
		return (
			<div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
				The organizer&apos;s payment instructions are unavailable. Cancel this
				reservation and try again later.
			</div>
		);
	}

	return (
		<div className={compact ? "space-y-4" : "space-y-5 py-2"}>
			<div className="flex items-start justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
				<div>
					<div className="flex items-center gap-2 font-semibold">
						<Clock3 className="h-4 w-4 text-primary" />
						Your seats are held
					</div>
					<p className="mt-1 text-sm text-muted-foreground">
						Pay and submit the transaction ID before the timer ends.
					</p>
				</div>
				<div
					className={`shrink-0 rounded-lg px-3 py-1.5 font-mono text-sm font-bold ${
						hasExpired
							? "bg-destructive/10 text-destructive"
							: "bg-background text-primary"
					}`}
				>
					{formatTimeLeft(timeLeft)}
				</div>
			</div>

			<div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-4 text-sm">
				<div>
					<p className="text-muted-foreground">Booking reference</p>
					<p className="font-semibold">{booking.booking_reference}</p>
				</div>
				<div className="text-right">
					<p className="text-muted-foreground">Exact amount</p>
					<p className="text-lg font-bold text-primary">
						{formatMoney(booking.total_price, booking.currency)}
					</p>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor={`payment-method-${booking.id}`}>Pay using</Label>
				<Select value={methodId} onValueChange={setMethodId}>
					<SelectTrigger id={`payment-method-${booking.id}`}>
						<SelectValue placeholder="Choose a payment method" />
					</SelectTrigger>
					<SelectContent>
						{methods.map((method) => (
							<SelectItem key={method.id} value={method.id}>
								{method.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{selectedMethod && (
				<div className="rounded-xl border p-4">
					<div className="mb-3 flex items-center gap-2 font-semibold">
						<ExternalLink className="h-4 w-4 text-primary" />
						Send payment outside Travelomo
					</div>
					<div className="space-y-2 text-sm">
						<div className="flex justify-between gap-4">
							<span className="text-muted-foreground">Method</span>
							<span className="font-medium">{selectedMethod.name}</span>
						</div>
						<div className="flex justify-between gap-4">
							<span className="text-muted-foreground">Account name</span>
							<span className="text-right font-medium">
								{selectedMethod.account_name}
							</span>
						</div>
						<div className="flex items-center justify-between gap-4">
							<span className="text-muted-foreground">Account number</span>
							<div className="flex items-center gap-1">
								<span className="font-mono font-semibold">
									{selectedMethod.account_number}
								</span>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									onClick={copyAccountNumber}
									aria-label="Copy account number"
								>
									<Copy className="h-3.5 w-3.5" />
								</Button>
							</div>
						</div>
						{selectedMethod.instructions && (
							<p className="mt-3 rounded-lg bg-muted p-3 text-muted-foreground">
								{selectedMethod.instructions}
							</p>
						)}
					</div>
				</div>
			)}

			<div className="space-y-2">
				<Label htmlFor={`transaction-id-${booking.id}`}>
					Transaction ID
				</Label>
				<div className="relative">
					<ReceiptText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
					<Input
						id={`transaction-id-${booking.id}`}
						className="pl-9 font-mono"
						placeholder="Enter the ID from your payment receipt"
						value={transactionId}
						onChange={(event) => setTransactionId(event.target.value)}
						disabled={hasExpired || isPending}
					/>
				</div>
				<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
					<ShieldCheck className="h-3.5 w-3.5" />
					Submission does not confirm payment. The organizer verifies it manually.
				</p>
			</div>

			<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				{onCancel && (
					<Button type="button" variant="outline" onClick={onCancel}>
						Cancel reservation
					</Button>
				)}
				<Button
					type="button"
					disabled={
						hasExpired || isPending || !methodId || transactionId.trim().length < 4
					}
					onClick={() => submitReference()}
				>
					{isPending ? (
						"Submitting..."
					) : (
						<>
							<Check className="mr-2 h-4 w-4" /> Submit for verification
						</>
					)}
				</Button>
			</div>
		</div>
	);
}
