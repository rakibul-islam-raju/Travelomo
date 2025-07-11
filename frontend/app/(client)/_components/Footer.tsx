import { AppLogo } from "@/components/AppLogo";
import { siteConfig } from "@/config/siteConfig";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import Link from "next/link";

export default function Footer() {
	return (
		<footer className="bg-primary/5 pt-12 mt-16 border-t border-primary/20">
			<div className="container grid grid-cols-1 md:grid-cols-3 gap-8">
				{/* Brand & Social */}
				<div>
					<AppLogo className="text-primary" />
					<p className="text-sm text-muted-foreground">{siteConfig.subtitle}</p>

					<div className="mt-6">
						<h3 className="text-lg font-semibold text-primary mb-2">
							Follow Us
						</h3>
						<div className="flex gap-4">
							<Link
								href={siteConfig.links.facebook}
								aria-label="Facebook"
								className="hover:text-primary"
							>
								<Facebook />
							</Link>
							<Link
								href={siteConfig.links.instagram}
								aria-label="Instagram"
								className="hover:text-primary"
							>
								<Instagram />
							</Link>
							<Link
								href={siteConfig.links.linkedin}
								aria-label="LinkedIn"
								className="hover:text-primary"
							>
								<Linkedin />
							</Link>
							<Link
								href={siteConfig.links.twitter}
								aria-label="Twitter"
								className="hover:text-primary"
							>
								<Twitter />
							</Link>
						</div>
					</div>
				</div>

				{/* Quick Links */}
				<div className="grid grid-cols-2 gap-4">
					<div>
						<h3 className="text-lg font-semibold text-primary mb-2">
							Quick Links
						</h3>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li>
								<Link href="/" className="hover:underline">
									Privacy Policy
								</Link>
							</li>
							<li>
								<Link href="/" className="hover:underline">
									Terms & Conditions
								</Link>
							</li>
							<li>
								<Link href="/" className="hover:underline">
									Contact Us
								</Link>
							</li>
						</ul>
					</div>
					<div>
						<h3 className="text-lg font-semibold text-primary mb-2 invisible">
							Extra
						</h3>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li>
								<Link href="/registration" prefetch className="hover:underline">
									Create Account
								</Link>
							</li>
							<li>
								<Link
									href="/vendor-registration"
									prefetch
									className="hover:underline"
								>
									Vendor Signup
								</Link>
							</li>
						</ul>
					</div>
				</div>

				{/* Contact */}
				<div>
					<h3 className="text-lg font-semibold text-primary mb-2">Contact</h3>
					<p className="text-sm text-muted-foreground mb-1">
						Email:{" "}
						<a href={`mailto:${siteConfig.email}`} className="hover:underline">
							{siteConfig.email}
						</a>
					</p>
					<p className="text-sm text-muted-foreground">
						Phone:{" "}
						<a href={`tel:${siteConfig.phone}`} className="hover:underline">
							{siteConfig.phone}
						</a>
					</p>
				</div>
			</div>

			{/* Bottom Bar */}
			<div className="mt-12 border-t border-primary/20 py-2 bg-primary/90 text-white">
				<div className="container text-center">
					<p className="text-sm font-medium">
						&copy; {new Date().getFullYear()} {siteConfig.name}. All rights
						reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}
