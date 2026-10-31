import type { Metadata } from "next";
import { cookies } from "next/headers";
import { VolunteerView } from "@/components/volunteer-view";
import { volunteerMetadata } from "@/lib/manifest";
import { getVolunteer } from "@/lib/schedule";

type Props = { searchParams: Promise<{ now?: string }> };

// Who is looking at the general page? A volunteer who opened their personal link before has the cookie.
async function rememberedVolunteer() {
  const slug = (await cookies()).get("volunteer")?.value;
  return slug ? getVolunteer(slug) : null;
}

export async function generateMetadata(): Promise<Metadata> {
  // If a volunteer adds the general page to the home screen anyway, still give the icon their personal manifest.
  const volunteer = await rememberedVolunteer();
  return volunteer ? volunteerMetadata(volunteer.slug) : {};
}

export default async function Home({ searchParams }: Props) {
  const { now } = await searchParams;
  const volunteer = await rememberedVolunteer();

  return (
    <>
      {volunteer ? (
        <VolunteerView volunteer={volunteer} now={now} />
      ) : (
        <>
          <p className="eyebrow">ICPC Checkpoint</p>
          <h1>Welcome to contest day</h1>
        </>
      )}
      {/* Contestant content (schedule, map, food) comes in step 3. */}
      <h2 className="section-title">Contest day</h2>
      <div className="card">
        <p className="card-loc">The day&apos;s schedule, map and food options will appear here.</p>
      </div>
    </>
  );
}
