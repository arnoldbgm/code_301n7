import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";

export default function Layout() {
   return (
      <div className="bg-amber-50 text-stone-800 min-h-screen">
         <Header />
         <main className="pt-20">
            <Outlet /> {/* Este valor va a cambiar */}
         </main>
         <Footer />
      </div>
   )
}