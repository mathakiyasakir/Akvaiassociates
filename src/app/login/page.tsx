"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppContext";
import { LoginView } from "@/components/LoginView";

export default function LoginPage() {
  const router = useRouter();
  const { user, authReady, loginIntentToken } = useApp();

  // Block direct /login visits when no server-signed in-app login intent exists
  useEffect(() => {
    if (authReady && (user || !loginIntentToken)) {
      router.replace("/");
    }
  }, [authReady, user, loginIntentToken, router]);

  if (!loginIntentToken || user) {
    return null;
  }

  return <LoginView />;
}
