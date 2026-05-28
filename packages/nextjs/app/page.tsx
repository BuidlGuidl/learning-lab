import Link from "next/link";
import type { NextPage } from "next";
import { registry } from "~~/labs/registry";

const Home: NextPage = () => {
  return (
    <div className="flex flex-col items-center gap-6 py-12 px-4">
      <h1 className="text-2xl font-semibold">Pick a lab</h1>
      <ul className="flex flex-col gap-3 w-full max-w-md">
        {Object.entries(registry).map(([id, { title }]) => (
          <li key={id}>
            <Link href={`/labs/${id}`} className="btn btn-primary btn-block">
              {title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
