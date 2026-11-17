import Image from "next/image";
import { Suspense } from "react";

import LogoutButton from "./LogoutButton";
import SidebarMenu from "./SidebarMenu";
import UserCard from "./UserCard";

export default function Sidebar() {
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
            <Suspense
               fallback={
                  <ul className="flex flex-col gap-3">
                     {Array.from({ length: 4 }, (_, index) => (
                        <li
                           key={index}
                           className="h-11 animate-pulse rounded-xl bg-slate-100"
                        />
                     ))}
                  </ul>
               }
            >
               <SidebarMenu />
            </Suspense>
         </nav>
         <div className="mt-auto space-y-3">
            <Suspense
               fallback={
                  <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
                     <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
                     <div className="flex-1 space-y-2">
                        <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                        <div className="h-2.5 w-32 animate-pulse rounded bg-slate-200" />
                     </div>
                  </div>
               }
            >
               <UserCard />
            </Suspense>
            <LogoutButton />
         </div>
      </aside>
   )
}
