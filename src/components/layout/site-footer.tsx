import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { categories } from "@/data/categories";
import { siteConfig } from "@/config/site";

const explore = [
  { label: "Business directory", href: "/directory" },
  { label: "Upcoming events", href: "/events" },
  { label: "About the mission", href: "/#mission" },
  { label: "Join the community", href: "/register" },
];

const account = [
  { label: "Sign in", href: "/login" },
  { label: "Create an account", href: "/register" },
  { label: "Admin dashboard (demo)", href: "/admin" },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-auto overflow-hidden bg-olive-950 text-olive-100">
      <div className="topo-bg pointer-events-none absolute inset-0 opacity-[0.12]" aria-hidden />
      <div className="container-page relative py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="inline-flex rounded-lg bg-sand-50 p-3">
              <Logo imgClassName="h-20" />
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-olive-200/80">{siteConfig.description}</p>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-olive-300" aria-hidden />
                <span>{siteConfig.contact.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="size-4 shrink-0 text-olive-300" aria-hidden />
                <a className="hover:text-white hover:underline" href={`tel:${siteConfig.contact.phone}`}>
                  {siteConfig.contact.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="size-4 shrink-0 text-olive-300" aria-hidden />
                <a className="hover:text-white hover:underline" href={`mailto:${siteConfig.contact.email}`}>
                  {siteConfig.contact.email}
                </a>
              </li>
            </ul>
          </div>

          <nav aria-label="Explore" className="lg:col-span-2 lg:col-start-6">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-olive-300">Explore</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {explore.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Categories" className="lg:col-span-3">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-olive-300">Categories</h3>
            <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2 lg:grid-cols-1">
              {categories.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link href={`/directory?category=${c.id}`} className="hover:text-white hover:underline">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Account" className="lg:col-span-2">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-olive-300">Account</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {account.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-olive-800 pt-6 text-xs text-olive-300 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Mission: SITREP. Phase 1 frontend preview.</p>
          <p className="max-w-xl sm:text-right">
            All businesses, events, ratings and contact details shown are fictional sample data and not verified real-world information.
          </p>
        </div>
      </div>
    </footer>
  );
}
