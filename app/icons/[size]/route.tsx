import { ImageResponse } from "next/og";

// /icons/180, /icons/192, /icons/512 — the home-screen icon, drawn as a PNG from this code (no image files to keep in sync).
// ponytail: text placeholder; swap in the official FIU / HSPC logo files once Lingtong provides them.
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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0E1420",
          color: "#F5B942",
          fontWeight: 700,
        }}
      >
        <div style={{ fontSize: size * 0.36, lineHeight: 1 }}>FIU</div>
        <div style={{ width: size * 0.42, height: size * 0.015, background: "#F5B942", margin: `${size * 0.05}px 0` }} />
        <div style={{ fontSize: size * 0.16, lineHeight: 1, letterSpacing: size * 0.012, color: "#E6EDF6" }}>HSPC</div>
      </div>
    ),
    { width: size, height: size },
  );
}
