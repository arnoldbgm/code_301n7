"use client";

import { Button } from "@heroui/react";
import { signOut } from "next-auth/react";
import { FiLogOut } from "react-icons/fi";

export default function LogoutButton() {
  return (
    <Button
      type="button"
      variant="danger-soft"
      className="w-full"
      onPress={() => {
        void signOut({ callbackUrl: "/" });
      }}
    >
      <FiLogOut />
      Cerrar sesión
    </Button>
  );
}
