"use client";

import DefaultLogo from "@/assets/images/default-logo.png";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetVendorDetailsQuery } from "@/lib/features/vendor/vendorApi";
import { useSession } from "next-auth/react";
import Image from "next/image";
export const VendorInfo = () => {
	const session = useSession();
	const vendor = session.data?.user?.vendor;

	const { data: vendorDetails } = useGetVendorDetailsQuery(vendor?.id, {
		skip: !vendor?.id,
	});

	console.log("vendorDetails =>", vendorDetails);
	console.log("vendor =>", vendor);

	return (
		<Card className="relative">
			<CardContent className="p-6">
				<div className="flex justify-between items-center mb-2">
					{!vendorDetails?.is_approved && (
						<Badge variant={"pending"}>
							<span className="text-xs font-semibold">Pending</span>
						</Badge>
					)}
					<div className="flex justify-end">
						<Button size="sm" variant="link">
							Edit Store
						</Button>
					</div>
				</div>
				<div className="flex flex-col md:flex-row items-start gap-6">
					<Avatar className="size-32 rounded-lg shadow-md ring-2 ring-gray-100">
						<Image
							src={vendor?.logo ?? DefaultLogo}
							alt="Vendor Logo"
							width={150}
							height={150}
							className="object-cover"
						/>
					</Avatar>
					<div className="flex flex-col">
						<h1 className="text-3xl font-semibold text-gray-900 mb-2">
							{vendor?.store_name}
						</h1>
						<p className="text-sm text-gray-600 leading-relaxed max-w-md">
							Lorem ipsum dolor sit amet consectetur adipisicing elit.
						</p>
						<div className="flex items-start gap-2 mt-3">
							<svg
								className="w-4 h-4 text-gray-500"
								fill="none"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
							</svg>
							<p className="text-sm text-gray-700">
								{vendorDetails?.store_email ?? "--"}
							</p>
						</div>
						<div className="flex items-start gap-2 mt-2">
							<svg
								className="w-4 h-4 text-gray-500"
								fill="none"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
							</svg>
							<p className="text-sm text-gray-700">
								{vendorDetails?.store_phone ?? "--"}
							</p>
						</div>
						<div className="flex items-start gap-2 mt-2">
							<svg
								className="w-4 h-4 text-gray-500"
								fill="none"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
								<path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							<div className="flex flex-col">
								<p className="text-sm text-gray-700">
									{vendorDetails?.address_line_1 ?? "--"}
								</p>
								<p className="text-sm text-gray-700">
									{vendorDetails?.address_line_2 ?? "--"}
								</p>
								<p className="text-sm text-gray-700">
									{vendorDetails?.city ?? "--"}
								</p>
								<p className="text-sm text-gray-700">
									{vendorDetails?.state ?? "--"}
								</p>
								<p className="text-sm text-gray-700">
									{vendorDetails?.zip_code ?? "--"}
								</p>
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
