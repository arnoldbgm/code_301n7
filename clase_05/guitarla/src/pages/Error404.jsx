import { Link } from "react-router-dom";

export default function Error404() {
   return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
         <h1 className="text-7xl font-bold text-amber-700 mb-4">404</h1>
         <p className="text-xl text-stone-600 mb-8">Página no encontrada</p>

         {/* 
         Reto 02
         01. Mostrar una imagen y que se renderize un gato
         para esto consumir la siguiente api:
         
         https://cataas.com/cat

         Requisitos de estilos, la imagen debe de contar con
         bordes redondeados

         02. Crear un boton de que redirecione al inicio
         "/"
      */}
         <img src="https://cataas.com/cat" className="rounded-2xl w-50 mb-5" />
         <Link to="/"
            className="border py-2 px-6 bg-black text-white rounded-2xl">
            Ir al Inicio
         </Link>
      </div>
   )
}