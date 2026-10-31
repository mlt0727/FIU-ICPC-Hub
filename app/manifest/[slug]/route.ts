import { manifestResponse } from "@/lib/manifest";

// /manifest/lingtong-meng — the home-screen icon opens /lingtong-meng.
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Only letters, digits and "-" can appear in a slug (see lib/slug.ts); refuse anything else.
  if (!/^[a-z0-9-]+$/.test(slug)) return new Response("Not found", { status: 404 });
  return manifestResponse(`/${slug}`);
}
