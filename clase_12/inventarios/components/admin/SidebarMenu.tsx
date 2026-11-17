import Link from "next/link";
import { CiMoneyBill, CiUser } from "react-icons/ci";
import { IoCartOutline, IoHomeOutline } from "react-icons/io5";

import { getAuthPayload } from "@/src/lib/auth-cookie";
import {
  canAccessAdminPath,
  DEFAULT_AUTH_ROLE,
  type AuthRole,
} from "@/src/lib/roles";

interface Item {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const MENU_ITEMS: Item[] = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: <IoHomeOutline />,
  },
  {
    name: "Clientes",
    href: "/admin/clientes",
    icon: <CiUser />,
  },
  {
    name: "Productos",
    href: "/admin/productos",
    icon: <IoCartOutline />,
  },
  {
    name: "ventas",
    href: "/admin/ventas",
    icon: <CiMoneyBill />,
  },
];

/**
 * Renders the navigation links allowed for the role in the `auth_token` JWT.
 * `USUARIO` only sees Productos; `SUPER_USUARIO` sees every module.
 */
export default async function SidebarMenu() {
  const payload = await getAuthPayload();
  const role: AuthRole = payload?.role ?? DEFAULT_AUTH_ROLE;
  const items = MENU_ITEMS.filter((item) =>
    canAccessAdminPath(role, item.href),
  );

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.href} className="border p-2 rounded-xl">
          <Link href={item.href} className="flex items-center gap-3">
            <span className="text-2xl">{item.icon}</span>
            {item.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
