"use client";

import { Button } from "@heroui/react";
import { signIn } from "next-auth/react";
import { FaGithub } from "react-icons/fa";

export default function GithubLoginButton() {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onPress={() => {
        void signIn("github", { callbackUrl: "/admin/dashboard" });
      }}
    >
      <FaGithub />
      Iniciar sesión con GitHub
    </Button>
  );
}
