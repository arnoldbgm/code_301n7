import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Contactanos from "./pages/Contactanos"
import Acerca from "./pages/Acerca"
import Layout from "./layout/Layout"
import Error404 from "./pages/Error404"

export default function App() {
  // 🏅 REGLA DE ORO
  // Siempre los componentes retornan algo
  return (
    // Vas a soportar las siguientes rutas
    <Routes>
      <Route element={<Layout />}>
        {/* A todas las rutas hijas que se encuentren
      dentro del Route se les va aplicar el LAYOUT  */}
        <Route path="/" element={<Home />} />
        <Route path="/contacto" element={<Contactanos />} />
        <Route path="/acerca" element={<Acerca />} />
        <Route path="*" element={<Error404 />} />
      </Route>
    </Routes>
  )
}