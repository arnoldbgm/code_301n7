import { Link } from "react-router-dom"

export default function Home() {
  return (
    <div>
      <h1>Bienvenidos a Luthier &amp; Co.</h1>
      <p>Expertos en instrumentos finos desde 1994.</p>
      <nav>
        <Link to="/contacto">Contactanos</Link>
        <Link to="/acerca">Acerca de nosotros</Link>
      </nav>
    </div>
  )
}