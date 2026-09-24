import { Link } from "react-router-dom";
import { IoCartOutline } from "react-icons/io5";
import { CiUser } from "react-icons/ci";

export default function Header() {
   return (
      <header className="border flex justify-between py-5 px-15">
         {/* Logo */}
         <div className="fles items-center">
            <span className="font-bold text-xl">Luthier & Co.</span>
         </div>
         {/* Navegacion */}
         <nav className="flex items-center gap-4">
            <Link>Shop</Link>
            <Link>Vintage</Link>
            <Link>Custom Shop</Link>
            <Link>Lessons</Link>
            <Link>About</Link>
         </nav>
         {/* Iconos */}
         <div className="flex items-center gap-2">
            <IoCartOutline className="text-2xl"/>
            <CiUser className="text-2xl"/>
         </div>
      </header>
   )
}