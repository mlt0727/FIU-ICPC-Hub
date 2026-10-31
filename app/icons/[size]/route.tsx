import { ImageResponse } from "next/og";

// /icons/180, /icons/192, /icons/512 — the home-screen icon, drawn as a PNG from this code (no image files to keep in sync).
const SIZES = new Set([180, 192, 512]);

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0E1420",
          color: "#F5B942",
          fontSize: size * 0.28,
          fontWeight: 700,
          letterSpacing: -size * 0.005,
        }}
      >
        ICPC
      </div>
    ),
    { width: size, height: size },
  );
}
