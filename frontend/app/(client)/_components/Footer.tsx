import { siteConfig } from "@/config/siteConfig";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";

export default function Footer() {
	return (
		<footer className="bg-primary/10 pt-8 mt-12">
			<div className="container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				<div className="">
					<Link href="/">
						<h2 className="text-primary text-2xl md:text-4xl font-bold">
							{siteConfig.name}
						</h2>
					</Link>

					<p className="text-sm text-muted-foreground">{siteConfig.subtitle}</p>

					<div className="flex flex-col gap-2 mt-4">
						<h3 className="text-primary text-lg font-bold">Follow Us</h3>
						<div className="flex gap-6">
							<Link href={siteConfig.links.facebook}>
								<Facebook className="text-primary" />
							</Link>
							<Link href={siteConfig.links.instagram}>
								<Instagram className="text-primary" />
							</Link>
							<Link href={siteConfig.links.linkedin}>
								<Linkedin className="text-primary" />
							</Link>
							<Link href={siteConfig.links.linkedin}>
								<Twitter className="text-primary" />
							</Link>
						</div>
					</div>
				</div>
				<div className="flex flex-col gap-4">
					<h3 className="text-primary text-lg font-bold">Quick Links</h3>
					<div className="flex gap-6">
						<ul className="list-none p-0 m-0 inline-flex flex-col gap-2">
							<li className="text-sm text-muted-foreground hover:underline">
								<Link href="/" className="hover:underline">
									Privacy & Policy
								</Link>
							</li>
							<li className="text-sm text-muted-foreground hover:underline">
								<Link href="/" className="hover:underline">
									Terms & Conditions
								</Link>
							</li>
							<li className="text-sm text-muted-foreground hover:underline">
								<Link href="/" className="hover:underline">
									Contact Us
								</Link>
							</li>
						</ul>
						<ul className="list-none p-0 m-0 inline-flex flex-col gap-2">
							<li className="text-sm text-muted-foreground">
								<Link href="/" className="hover:underline">
									Create An Account
								</Link>
							</li>
							<li className="text-sm text-muted-foreground hover:underline">
								<Link href="/" className="hover:underline">
									Create A Vendor Account
								</Link>
							</li>
						</ul>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<div className="flex flex-col gap-2">
						<h3 className="text-primary text-lg font-bold">Contact Us</h3>
						<p className="text-sm text-muted-foreground">
							Email: {siteConfig.email}
						</p>
						<p className="text-sm text-muted-foreground">
							Phone: {siteConfig.phone}
						</p>
					</div>
				</div>
			</div>
			<div className="bg-primary/90 text-white py-2 mt-6">
				<div className="flex flex-col items-center justify-center">
					<p className="text-sm font-bold">
						&copy; {new Date().getFullYear()} {siteConfig.name}. All rights
						reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}
