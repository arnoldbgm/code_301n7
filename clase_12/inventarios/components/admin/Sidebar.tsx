import Image from "next/image";
import { IoHomeOutline, IoCartOutline } from "react-icons/io5";
import { CiUser, CiMoneyBill } from "react-icons/ci";
import Link from "next/link";

interface Item {
   name: string,
   href: string,
   icon: React.ReactNode
}

export default function Sidebar() {
   const menuItems: Item[] = [
      {
         name: "Dashboard",
         href: "/admin/dashboard",
         icon: <IoHomeOutline />
      },
      {
         name: "Clientes",
         href: "/admin/clientes",
         icon: <CiUser />
      },
      {
         name: "Productos",
         href: "/admin/productos",
         icon: <IoCartOutline />
      },
      {
         name: "ventas",
         href: "/admin/ventas",
         icon: <CiMoneyBill />
      },
   ]

   return (
      <aside className="border h-screen w-64 px-4 py-6 border-slate-300 rounded-tr-2xl rounded-br-2xl flex flex-col">
         <div className="flex items-center gap-2 mb-9">
            <Image
               src="/images/logo.png"
               alt="Logo de la empresa"
               width={50}
               height={50}
            />
            <h1 className="text-xl">Tiendita Enter</h1>
         </div>
         <nav>
            <ul className="flex flex-col gap-3">
               {menuItems.map((item, index) => (
                  <li key={index} className="border p-2 rounded-xl">
                     <Link href={item.href} className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        {item.name}
                     </Link>
                  </li>
               ))}
            </ul>
         </nav>
      </aside>
   )
}