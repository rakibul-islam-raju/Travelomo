"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { vendorServices } from "@/services/vendorServices";
import {
	VendorPaymentMethod,
	VendorPaymentMethodInput,
} from "@/types/vendor.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertCircle,
	CheckCircle2,
	CreditCard,
	Pencil,
	Plus,
	ShieldCheck,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const emptyForm: VendorPaymentMethodInput = {
	name: "",
	account_name: "",
	account_number: "",
	instructions: "",
	is_active: true,
};

export default function PaymentMethodsPage() {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(false);
	const [editing, setEditing] = useState<VendorPaymentMethod | null>(null);
	const [form, setForm] = useState<VendorPaymentMethodInput>(emptyForm);

	const { data: methods = [], isLoading, isError, refetch } = useQuery({
		queryKey: ["VendorPaymentMethods"],
		queryFn: vendorServices.getPaymentMethods,
	});

	const closeForm = () => {
		setOpen(false);
		setEditing(null);
		setForm(emptyForm);
	};

	const openCreate = () => {
		setEditing(null);
		setForm(emptyForm);
		setOpen(true);
	};

	const openEdit = (method: VendorPaymentMethod) => {
		setEditing(method);
		setForm({
			name: method.name,
			account_name: method.account_name,
			account_number: method.account_number,
			instructions: method.instructions,
			is_active: method.is_active,
		});
		setOpen(true);
	};

	const refresh = () =>
		queryClient.invalidateQueries({ queryKey: ["VendorPaymentMethods"] });

	const { mutate: saveMethod, isPending: saving } = useMutation({
		mutationFn: () =>
			editing
				? vendorServices.updatePaymentMethod(editing.id, form)
				: vendorServices.createPaymentMethod(form),
		onSuccess: () => {
			toast.success(editing ? "Payment method updated" : "Payment method added");
			closeForm();
			refresh();
		},
	});

	const { mutate: toggleMethod, isPending: toggling } = useMutation({
		mutationFn: (method: VendorPaymentMethod) =>
			vendorServices.updatePaymentMethod(method.id, {
				is_active: !method.is_active,
			}),
		onSuccess: (updated) => {
			toast.success(updated.is_active ? "Payment method enabled" : "Payment method paused");
			refresh();
		},
	});

	const { mutate: deleteMethod, isPending: deleting } = useMutation({
		mutationFn: (method: VendorPaymentMethod) =>
			vendorServices.deletePaymentMethod(method.id),
		onSuccess: () => {
			toast.success("Payment method removed");
			refresh();
		},
	});

	const valid =
		form.name.trim() && form.account_name.trim() && form.account_number.trim();

	return (
		<div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
			<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
				<div>
					<p className="text-sm font-medium text-primary">Booking payments</p>
					<h1 className="text-3xl font-bold tracking-tight">Payment instructions</h1>
					<p className="mt-2 max-w-2xl text-muted-foreground">
						Tell customers where to pay before they submit a transaction ID. Travelomo never moves the money.
					</p>
				</div>
				<Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add payment method</Button>
			</div>

			<div className="flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
				<ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
				<div>
					<p className="font-semibold">Keep these details accurate</p>
					<p className="mt-1 text-blue-900/80">Customers see the active account name, number, and instructions after their seats are held. Pause a method anytime to stop offering it for new bookings.</p>
				</div>
			</div>

			{isLoading && (
				<div className="grid gap-4 md:grid-cols-2">{[0, 1].map((item) => <div key={item} className="h-52 animate-pulse rounded-2xl border bg-muted/50" />)}</div>
			)}

			{isError && (
				<div className="rounded-2xl border border-destructive/30 p-10 text-center"><AlertCircle className="mx-auto h-9 w-9 text-destructive" /><p className="mt-3 font-semibold">Payment methods could not be loaded</p><Button className="mt-4" variant="outline" onClick={() => refetch()}>Try again</Button></div>
			)}

			{!isLoading && !isError && methods.length === 0 && (
				<div className="rounded-2xl border border-dashed p-12 text-center"><CreditCard className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-4 text-lg font-semibold">Add a way for customers to pay</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">For example, add a bKash, Nagad, bank transfer, or other account you verify manually.</p><Button className="mt-5" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add your first method</Button></div>
			)}

			<div className="grid gap-4 md:grid-cols-2">
				{methods.map((method) => (
					<Card key={method.id} className={!method.is_active ? "opacity-70" : ""}>
						<CardHeader className="pb-3">
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><CreditCard className="h-5 w-5" /></div><div><CardTitle className="text-lg">{method.name}</CardTitle><p className={`mt-1 flex items-center gap-1 text-xs ${method.is_active ? "text-green-700" : "text-muted-foreground"}`}>{method.is_active && <CheckCircle2 className="h-3.5 w-3.5" />}{method.is_active ? "Shown to customers" : "Paused"}</p></div></div>
								<Switch checked={method.is_active} disabled={toggling} onCheckedChange={() => toggleMethod(method)} aria-label={`${method.is_active ? "Pause" : "Enable"} ${method.name}`} />
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="rounded-xl bg-muted/60 p-3 text-sm"><p className="text-xs text-muted-foreground">Account name</p><p className="font-medium">{method.account_name}</p><p className="mt-2 text-xs text-muted-foreground">Account number</p><p className="font-mono font-semibold">{method.account_number}</p></div>
							{method.instructions && <p className="line-clamp-2 text-sm text-muted-foreground">{method.instructions}</p>}
							<div className="flex justify-end gap-2 border-t pt-3"><Button size="sm" variant="ghost" onClick={() => openEdit(method)}><Pencil className="mr-1.5 h-4 w-4" />Edit</Button><Button size="sm" variant="ghost" className="text-destructive" disabled={deleting} onClick={() => deleteMethod(method)}><Trash2 className="mr-1.5 h-4 w-4" />Remove</Button></div>
						</CardContent>
					</Card>
				))}
			</div>

			<Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && closeForm()}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader><DialogTitle>{editing ? "Edit payment method" : "Add payment method"}</DialogTitle><p className="text-sm text-muted-foreground">Customers will use these details to pay you outside Travelomo.</p></DialogHeader>
					<div className="space-y-4 py-2">
						<div className="space-y-2"><Label htmlFor="method-name">Method name</Label><Input id="method-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Example: bKash Personal or Bank Transfer" /></div>
						<div className="space-y-2"><Label htmlFor="account-name">Account holder name</Label><Input id="account-name" value={form.account_name} onChange={(event) => setForm({ ...form, account_name: event.target.value })} placeholder="Name customers should see" /></div>
						<div className="space-y-2"><Label htmlFor="account-number">Account or wallet number</Label><Input id="account-number" value={form.account_number} onChange={(event) => setForm({ ...form, account_number: event.target.value })} placeholder="Example: 01XXXXXXXXX" /></div>
						<div className="space-y-2"><Label htmlFor="instructions">Helpful instructions (optional)</Label><Textarea id="instructions" value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} placeholder="Example: Use Send Money and include your name in the reference." rows={3} /></div>
					</div>
					<DialogFooter><Button variant="outline" onClick={closeForm}>Cancel</Button><Button disabled={!valid || saving} onClick={() => saveMethod()}>{saving ? "Saving..." : editing ? "Save changes" : "Add method"}</Button></DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
