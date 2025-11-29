import { useEffect, useState } from "react";
import { getSession } from "@stackframe/stack";

export function useUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function load() {
      const session = await getSession();
      setUser(session?.user ?? null);
    }

    load();
  }, []);

  return user;
}
