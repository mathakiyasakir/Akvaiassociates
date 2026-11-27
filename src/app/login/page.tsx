"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppContext";
import { LoginView } from "@/components/LoginView";

export default function LoginPage() {
  const router = useRouter();
  const { user, authReady } = useApp();

  useEffect(() => {
    if (authReady && user) {
      router.replace("/");
    }
  }, [authReady, user, router]);

  return <LoginView />;
}
