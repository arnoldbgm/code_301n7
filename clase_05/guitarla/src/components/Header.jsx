import { Link } from "react-router-dom"

export default function Header () {
   return (
      <nav>
         <Link to="/">Inicio</Link>
         <Link to="/contacto">Contacto</Link>
         <Link to="/acerca">Acerca</Link>
      </nav>
   )
}