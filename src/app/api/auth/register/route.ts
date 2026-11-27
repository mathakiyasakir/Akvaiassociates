import { secureJson } from "@/lib/security";

export async function POST() {
  return secureJson(
    {
      error:
        "Direct account creation is disabled. Email OTP verification is required to create an account.",
    },
    { status: 403 }
  );
}
