import Login from "@/components/login/Login";
import { Button } from "@heroui/react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";

export default function HomePage() {
  return (
    <div className="flex h-screen">
      <div className="w-[60%] bg-amber-400">
        Aqui vendra una imagen
      </div>
      <div className="flex flex-col justify-center w-[40%] p-16">
        <h2 className="font-semibold text-2xl mb-20">SaleSkip</h2>
        <h3 className="font-semibold text-2xl">Bienvenido de nuevo!</h3>
        <p className="text-gray-600">¿No tienes una cuenta? <Link href="/register" className="font-semibold text-black underline">create una cuenta nueva</Link>, es gratis y solo tomara menos de un minuto</p>
        <Login/> 
        <Button className="mt-4 w-full" variant="outline">
          <FcGoogle />Iniciar con Google
        </Button>
      </div>
    </div>
  );
}