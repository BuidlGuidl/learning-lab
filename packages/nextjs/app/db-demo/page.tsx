import { revalidatePath } from "next/cache";
import { createUser, getUsers } from "~~/services/database/repositories/users";

// Throwaway page to see the database from the app: add a user, list users. Remove in PR 2.
export const dynamic = "force-dynamic";

async function addUser(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!name || !email) return;

  await createUser({ id: crypto.randomUUID(), name, email });
  revalidatePath("/db-demo");
}

export default async function DbDemoPage() {
  const users = await getUsers();

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-xl font-semibold">db demo</h1>

      <form action={addUser} className="flex flex-col gap-2">
        <input name="name" placeholder="name" required className="input input-bordered w-full" />
        <input name="email" type="email" placeholder="email" required className="input input-bordered w-full" />
        <button type="submit" className="btn btn-primary">
          add user
        </button>
      </form>

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
