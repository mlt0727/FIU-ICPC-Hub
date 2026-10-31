import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RememberMe } from "@/components/remember-me";
import { VolunteerView } from "@/components/volunteer-view";
import { getVolunteer } from "@/lib/schedule";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ now?: string }> };

// Personal page, e.g. /lingtong-meng. Static routes like /manifest win over this one, so they don't clash.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  // This person's own manifest: "Add to Home Screen" from here makes an icon that always opens this page.
  return { manifest: `/manifest/${slug}` };
}

export default async function VolunteerPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { now } = await searchParams;
  const volunteer = await getVolunteer(slug);
  if (!volunteer) notFound();

  return (
    <>
      <RememberMe slug={volunteer.slug} />
      <VolunteerView volunteer={volunteer} now={now} />
    </>
  );
}
