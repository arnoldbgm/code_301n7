import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";
import Header from "../components/Header";

export default function Layout() {
   return (
      <div>
         <Header />
         <main>
            <Outlet /> {/* Este valor va a cambiar */}
         </main>
         <Footer />
      </div>
   )
}