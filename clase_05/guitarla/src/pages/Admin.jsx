import { useState } from "react"
import Swal from "sweetalert2";

export default function Admin() {

    // Vamos a crear nuestro estado
    const [formulario, setFormulario] = useState({
        nombre:"",
        dni:""
    })

    function handleChange (event){
        // Hasta aqui hemos llegado a extrare el nomnbre del input
        // hemos extraido el value del input
        const {name, value} = event.target;
        // Para lograr actualizar los valores, debemos de usar el setFormulario
        setFormulario({
            ...formulario,
            [name]:value
        })

    }

    async function handlesubmit (event){
        event.preventDefault();
        console.log(formulario);

        const data = await fetch("https://6ac44beaae53bf25b80f5515.mockapi.io/usuarios", {
            method:"POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formulario)
        })

        const response = await data.json()
        console.log(response)
        Swal.fire({
            title: `Usuario ${response.nombre} creado con id ${response.id}`,
            icon:"success"
        })
    }

    return (
        <div>
            {/* Los formularios seran tus aliados al insertar data */}
            <form onSubmit={handlesubmit}>
                <input type="text" 
                       name="nombre"
                       value={formulario.nombre}
                       onChange={handleChange}
                       placeholder="Nombre usuario" />
                <input type="text"
                       name="dni"
                       value={formulario.dni}
                       onChange={handleChange}
                       placeholder="DNI"/>

                <button 
                    type="submit"
                    className="bg-green-300 p-2 rounded">
                    Guardar
                </button>
            </form>
        </div>
    )
}