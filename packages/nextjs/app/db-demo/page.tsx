import { SignInButtons } from "~~/components/db-demo/SignInButtons";
import { getServerSession } from "~~/lib/session";
import { getUsers } from "~~/services/database/repositories/users";

// Throwaway page to verify Better Auth and list database users. Remove in PR 2.
export const dynamic = "force-dynamic";

export default async function DbDemoPage() {
  const session = await getServerSession();

  if (!session) return <SignInButtons />;

  const users = await getUsers();

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-xl font-semibold">db demo</h1>
      <p>
        signed in as {session.user.name} ({session.user.email})
      </p>

      <ul className="space-y-1">
        {users.map(u => (
          <li key={u.id} className="flex justify-between font-mono text-sm">
            <span>{u.name}</span>
            <span className="opacity-60">{u.email}</span>
          </li>
        ))}
        {users.length === 0 && <li className="opacity-60">no users yet</li>}
      </ul>
    </main>
  );
}
