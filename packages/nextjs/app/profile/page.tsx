import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { registry } from "~~/labs/registry";
import { flatIndex, totalCards } from "~~/lib/lab/position";
import { getServerSession } from "~~/lib/session";
import { getLabProgressByUser } from "~~/services/database/repositories/labProgress";

export const dynamic = "force-dynamic";

// The lab we point a learner at when they have no rows yet.
const STARTER_LAB_ID = "ethereum-101";

// The lab's filled action, spelled out because this page sits outside .lab: base.css pills every
// .btn from outside a cascade layer, so daisyUI's button can't be pulled back to the lab's radius here.
const PRIMARY_ACTION =
  "inline-flex h-8 shrink-0 items-center justify-center rounded border border-lab-violet bg-lab-violet px-3 text-sm font-bold text-pure-white transition-colors hover:border-lab-iris hover:bg-lab-iris dark:text-dark-bg";

// Fixed locale on purpose: this renders on the server, so a machine-local format would differ per reader.
const formatDay = (date: Date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const ProfilePage = async () => {
  const session = await getServerSession();
  if (!session) redirect("/");

  const rows = await getLabProgressByUser(session.user.id);
  const labs = await Promise.all(
    [...rows]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .map(async row => {
        const entry = registry[row.labId];
        // A handful of rows per learner, so loading each lab module server-side is cheap.
        const lab = entry ? (await entry.load()).lab : null;
        const reached = lab ? flatIndex(lab, row.snapshot.maxReached) + 1 : 0;
        // Prefer the live card count: the stored total is from the last save and lab content shifts.
        const total = lab ? totalCards(lab) : row.totalCards;
        const percent = total > 0 ? Math.round((Math.min(reached, total) / total) * 100) : 0;

        return {
          labId: row.labId,
          title: entry?.title ?? row.labId,
          percent,
          updatedAt: row.updatedAt,
          resumeHref: `/labs/${row.labId}?ch=${row.snapshot.maxReached.chapterIndex}&card=${row.snapshot.maxReached.cardIndex}`,
        };
      }),
  );

  const name = session.user.name?.trim() || session.user.email;
  const initial = (name || "?").charAt(0).toUpperCase();

  return (
    // flex-1 + bg-lab-canvas so the page reads as lab chrome rather than the daisyUI base canvas
    // showing through around the panels.
    <div className="flex-1 bg-lab-canvas">
      <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
        <div className="flex items-center gap-3">
          {session.user.image ? (
            // unoptimized: provider avatars are remote and next.config declares no images.remotePatterns.
            <Image src={session.user.image} alt="" width={48} height={48} className="rounded-full" unoptimized />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lab-violet text-lg font-bold text-pure-white dark:text-dark-bg">
              {initial}
            </span>
          )}
          <h1 className="m-0 truncate text-2xl font-bold text-lab-text">{name}</h1>
        </div>

        <h2 className="mt-10 mb-4 text-lg font-bold text-lab-text">Your labs</h2>

        {labs.length === 0 ? (
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-lab-border bg-lab-surface px-4 py-4">
            <p className="m-0 flex-1 text-sm text-lab-muted">No labs started yet.</p>
            <Link href={`/labs/${STARTER_LAB_ID}`} className={PRIMARY_ACTION}>
              Start {registry[STARTER_LAB_ID]?.title ?? "Ethereum 101"}
            </Link>
          </div>
        ) : (
          <ul className="m-0 list-none divide-y divide-lab-border rounded-lg border border-lab-border bg-lab-surface p-0">
            {labs.map(lab => {
              const iso = lab.updatedAt.toISOString();
              return (
                <li key={lab.labId} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4">
                  <div className="min-w-[14rem] flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="m-0 truncate text-base font-bold text-lab-text">{lab.title}</h3>
                      <span className="shrink-0 text-sm tabular-nums text-lab-muted">{lab.percent}%</span>
                    </div>
                    {/* Same two-element bar the lab footer uses, so progress reads identically in both places. */}
                    <div
                      className="relative mt-2 h-1 w-full overflow-hidden rounded bg-lab-track"
                      role="progressbar"
                      aria-label={`${lab.title} progress`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={lab.percent}
                    >
                      <span
                        className="absolute inset-y-0 left-0 rounded bg-lab-violet"
                        style={{ width: `${lab.percent}%` }}
                      />
                    </div>
                    <p className="m-0 mt-2 text-xs text-lab-muted">
                      Last activity{" "}
                      <time dateTime={iso} title={iso}>
                        {formatDay(lab.updatedAt)}
                      </time>
                    </p>
                  </div>
                  <Link href={lab.resumeHref} className={PRIMARY_ACTION}>
                    Continue
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
