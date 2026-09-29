export default function PersonajeCard({ id, image, name, ki }) {
   return (
      <div key={id} className="flex flex-col items-center gap-4 border rounded-3xl p-4 mb-3 w-1/2 bg-amber-200">
         <img className="w-40" src={image}></img>
         <h1>
            Nombre: {name}
         </h1>
         <h2>
            Ki: {ki}
         </h2>
      </div>
   )
}