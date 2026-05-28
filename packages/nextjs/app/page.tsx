import Link from "next/link";
import type { NextPage } from "next";
import { registry } from "~~/labs/registry";

// Dynamic-import each lab on the server so chapter titles live only in
// the lab definition. Caching them on the registry would double the
// source of truth and drift on rename.
const Home: NextPage = async () => {
  const labs = await Promise.all(
    Object.entries(registry).map(async ([id, { title, load }]) => {
      const { lab } = await load();
      return { id, title, chapters: lab.chapters.map(c => c.title) };
    }),
  );

  return (
    <div className="flex flex-col items-center gap-6 py-12 px-4">
      <h1 className="text-2xl font-semibold">Pick a lab</h1>
      <ul className="flex flex-col gap-4 w-full max-w-md">
        {labs.map(({ id, title, chapters }) => (
          <li key={id}>
            <Link
              href={`/labs/${id}`}
              className="card bg-base-100 shadow hover:shadow-lg transition-shadow border border-base-300"
            >
              <div className="card-body p-5">
                <h2 className="card-title text-base">{title}</h2>
                <ol className="text-sm text-base-content/70 list-decimal list-inside space-y-1 mt-1">
                  {chapters.map((chapterTitle, i) => (
                    <li key={i}>{chapterTitle}</li>
                  ))}
                </ol>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
