import Image from "next/image";

export default function Sidebar() {
   return (
      <aside className="border h-screen w-64 px-4 py-6 border-slate-300 rounded-tr-2xl rounded-br-2xl flex flex-col">
         <div className="flex items-center gap-2">
            <Image
               src="/images/logo.png"
               alt="Logo de la empresa"
               width={50}
               height={50} 
            />
            <h1 className="text-xl">Tiendita Enter</h1>
         </div>
         <nav>
            
         </nav>
      </aside>
   )
}