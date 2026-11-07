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
  nav: [
    { label: "Directory", href: "/directory" },
    { label: "Events", href: "/events" },
    { label: "About", href: "/#mission" },
  ],
} as const;

export const DEMO_NOTICE =
  "Sample data — all businesses, events, and ratings are fictional demo content.";
