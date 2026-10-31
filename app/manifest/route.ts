import { manifestResponse } from "@/lib/manifest";

// /manifest — for contestants: the home-screen icon opens the general page.
export function GET() {
  return manifestResponse("/");
}
