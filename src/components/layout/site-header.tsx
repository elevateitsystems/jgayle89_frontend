"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, UserRound, UserRoundCog } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { siteConfig } from "@/config/site";
import { useSession } from "@/hooks/use-session";
import { authService } from "@/services/auth-service";
import { ROLE_LABEL, USER_TYPE_LABEL, homePathFor } from "@/lib/permissions";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href.startsWith("/#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const [open, setOpen] = useState(false);
  /** e.g. "Veteran / Military" for members, "Staff" / "Administrator" for the back office. */
  const roleLine = session ? (session.role === "user" && session.userType ? USER_TYPE_LABEL[session.userType] : ROLE_LABEL[session.role]) : "";

  async function signOut() {
    await authService.logout();
    toast.success("You've been signed out.");
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-sand-200 bg-sand-50/90 backdrop-blur supports-[backdrop-filter]:bg-sand-50/80">
      <div className="hidden bg-olive-900 text-olive-100 sm:block">
        <p className="container-page flex h-8 items-center justify-center text-xs tracking-wide">
          Phase 1 preview · All listings, events and ratings are fictional sample data
        </p>
      </div>

      <div className="container-page flex h-[76px] items-center justify-between gap-4 lg:h-24">
        <Logo imgClassName="h-14 lg:h-[72px]" priority />

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={cn(
                "relative px-3.5 py-2 text-sm font-medium text-olive-900/80 transition-colors hover:text-olive-950",
                "after:absolute after:inset-x-3.5 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-brass after:transition-transform after:duration-200 hover:after:scale-x-100",
                isActive(pathname, item.href) && "text-olive-950 after:scale-x-100",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" className="gap-2 pl-2" aria-label="Account menu" />}
              >
                <span className="flex size-6 items-center justify-center rounded-full bg-olive-700 text-xs font-semibold text-white">
                  {session.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="max-w-32 truncate">{session.name}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 gap-1 p-1.5">
                <p className="px-3 py-2 text-xs text-muted-foreground">{roleLine}</p>
                <DropdownMenuItem className="px-3 py-2.5 text-sm" onClick={() => router.push(homePathFor(session))}>
                  <LayoutDashboard /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem className="px-3 py-2.5 text-sm" onClick={() => router.push("/account")}>
                  <UserRoundCog /> My profile
                </DropdownMenuItem>
                <DropdownMenuItem className="px-3 py-2.5 text-sm" onClick={signOut}>
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
                Sign in
              </Link>
              <Link href="/register" className={buttonVariants()}>
                Join the community
              </Link>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu" />}
          >
            <Menu />
          </SheetTrigger>
          <SheetContent side="right" className="w-[88vw] max-w-sm bg-sand-50 p-0">
            <SheetHeader className="border-b border-sand-200 p-4">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Logo imgClassName="h-14" href={null} />
            </SheetHeader>
            <nav aria-label="Mobile" className="flex flex-col p-3">
              {siteConfig.nav.map((item) => (
                <SheetClose
                  key={item.href}
                  nativeButton={false}
                  render={
                    <Link
                      href={item.href}
                      className={cn(
                        "rounded-md px-3 py-3.5 text-base font-medium text-olive-900 hover:bg-olive-100",
                        isActive(pathname, item.href) && "bg-olive-100",
                      )}
                    />
                  }
                >
                  {item.label}
                </SheetClose>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2 border-t border-sand-200 p-4">
              {session ? (
                <>
                  <p className="flex items-center gap-2 pb-1 text-sm text-muted-foreground">
                    <UserRound className="size-4" /> {session.name} · {roleLine}
                  </p>
                  <SheetClose nativeButton={false} render={<Link href={homePathFor(session)} className={buttonVariants({ size: "lg" })} />}>
                    Dashboard
                  </SheetClose>
                  <SheetClose
                    nativeButton={false}
                    render={<Link href="/account" className={buttonVariants({ variant: "outline", size: "lg" })} />}
                  >
                    My profile
                  </SheetClose>
                  <Button variant="outline" size="lg" onClick={signOut}>
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <SheetClose nativeButton={false} render={<Link href="/register" className={buttonVariants({ size: "lg" })} />}>
                    Join the community
                  </SheetClose>
                  <SheetClose nativeButton={false} render={<Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })} />}>
                    Sign in
                  </SheetClose>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
