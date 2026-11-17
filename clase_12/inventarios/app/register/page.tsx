import Image from "next/image";
import Link from "next/link";

import Register from "@/components/register/Register";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-[60%] bg-amber-400 md:block">
        <Image
          src="/images/wallpaper.webp"
          alt="Fondo de pantalla"
          width={1600}
          height={900}
          loading="eager"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex w-full flex-col justify-center p-8 md:w-[40%] md:p-16">
        <h2 className="mb-10 text-2xl font-semibold">SaleSkip</h2>
        <h3 className="text-2xl font-semibold">Crea tu cuenta</h3>
        <p className="mt-2 text-sm text-gray-600">
          Registra tus datos para empezar a administrar tu inventario.
        </p>
        <Register />
        <p className="mt-6 text-sm text-gray-600">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/" className="font-semibold text-black underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
