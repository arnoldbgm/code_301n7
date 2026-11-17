import { Avatar } from "@heroui/react";
import { getServerSession } from "next-auth";

import { authOptions } from "@/src/lib/auth";

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default async function UserCard() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) {
    return null;
  }

  const name = user.name ?? user.email ?? "Usuario";
  const initials = getInitials(name) || "U";

  return (
    <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
      <Avatar size="sm" variant="soft">
        {user.image ? (
          <Avatar.Image
            src={user.image}
            alt={`Foto de ${name}`}
          />
        ) : null}
        <Avatar.Fallback>{initials}</Avatar.Fallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{name}</p>
        {user.email ? (
          <p className="truncate text-xs text-gray-500">{user.email}</p>
        ) : null}
      </div>
    </div>
  );
}
