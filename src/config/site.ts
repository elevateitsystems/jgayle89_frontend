const features = {
  /** Veteran benefits directory — a later-phase feature, not part of Phase 1. */
  benefits: false as boolean,
};

export const siteConfig = {
  name: "Mission: SITREP",
  shortName: "SITREP",
  tagline: "The veteran community directory",
  description:
    "Mission: SITREP connects the community with veteran-owned businesses, local resources, and events — all in one trusted place.",
  /**
   * Official logo (trimmed + web-sized copy of the supplied artwork; the
   * full-resolution original is kept at /public/logo-original.png).
   */
  logoSrc: "/logo.png",
  contact: {
    email: "hello@missionsitrep.example",
    phone: "(555) 010-0142",
    address: "100 Demo Street, Suite 200, Arlington, VA 22201",
  },
  social: [
    { label: "Facebook", href: "#" },
    { label: "Instagram", href: "#" },
    { label: "LinkedIn", href: "#" },
  ],
  /**
   * Phase gates. Features for later phases stay in the codebase but are OFF:
   * their routes 404 and they are not linked from navigation.
   */
  features,
  nav: [
    { label: "Directory", href: "/directory" },
    { label: "Events", href: "/events" },
    ...(features.benefits ? [{ label: "Veteran Benefits", href: "/benefits" }] : []),
    { label: "About", href: "/#mission" },
  ],
} as const;

export const DEMO_NOTICE =
  "Sample data — all businesses, events, and ratings are fictional demo content.";
