// The web app manifest tells a phone how to install the site on the home screen.
// Each volunteer gets their own, with start_url = their page: on iPhone the home-screen app
// does not share Safari's cookies, so the icon itself has to remember who it belongs to.
export function manifestResponse(startUrl: string): Response {
  const manifest = {
    id: startUrl, // a different id per person, so two people on one phone get two separate apps
    name: "ICPC Checkpoint",
    short_name: "ICPC",
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
