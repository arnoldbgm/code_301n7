import { Link } from "react-router-dom";

export default function Error404 () {
   return (
      <div>
         <h1>404</h1>
         <h2>Not Found</h2>
         <p>La pagina no disponible</p>
         <Link to="/">Ir al inicio</Link>
      </div>
   )
}