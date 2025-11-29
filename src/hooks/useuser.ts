import { useUser as useStackUser } from "@stackframe/stack";

export function useUser() {
  const user = useStackUser({ or: 'redirect' });
  return user;
}
