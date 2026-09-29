import { useEffect, useState } from "react"
import { obtenerAPI } from "../helpers/api";
import PersonajeCard from "../components/PersonajeCard";

export default function Productos() {

   const [personajes, setPersonajes] = useState([]);
   const [loading, setLoading] = useState(true);

   // Para consumir una API dentro de REACT, debemos de usar el hook useEffect
   useEffect(() => {
      // Aqui recien es que viene tu funcion para consumir una API
      async function obtenerPersonaje() {
         const response = await obtenerAPI("https://dragonball-api.com/api/characters")
         setPersonajes(response.items) // Actualizo el estado 
         setLoading(false) // Actualizo el estado de loading
      }

      obtenerPersonaje()
   }, [])

   if (loading){
      return <h1>Cargando personajes.....</h1>
   }

   return (
      <>
         {personajes.map((personaje) => (
            <PersonajeCard id={personaje.id} 
                           image={personaje.image}
                           name={personaje.name}
                           ki={personaje.ki}
            />
         ))}
      </>
   )
}