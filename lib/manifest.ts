import type { Metadata } from "next";

// The web app manifest tells a phone how to install the site on the home screen.
// Each volunteer gets their own, with start_url = their page: on iPhone the home-screen app
// does not share Safari's cookies, so the icon itself has to remember who it belongs to.
// `name` is also the label under the home-screen icon.
export function manifestResponse(startUrl: string, name: string): Response {
  const manifest = {
    id: startUrl, // a different id per person, so two people on one phone get two separate apps
    name,
    short_name: name,
    start_url: startUrl,
    scope: "/", // every page of the site stays inside the app instead of opening Safari
    display: "standalone",
    background_color: "#0E1420",
    theme_color: "#0E1420",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
    ],
  };
  return Response.json(manifest, { headers: { "Content-Type": "application/manifest+json" } });
}

export const VOLUNTEER_APP_NAME = "ICPC Volunteer";

// <head> tags for a page that belongs to one volunteer: their manifest, and the iPhone home-screen name.
// appleWebApp replaces the layout's whole object, so capable and statusBarStyle are repeated here.
export function volunteerMetadata(slug: string): Metadata {
  return {
    manifest: `/manifest/${slug}`,
    appleWebApp: { capable: true, title: VOLUNTEER_APP_NAME, statusBarStyle: "black-translucent" },
  };
}
