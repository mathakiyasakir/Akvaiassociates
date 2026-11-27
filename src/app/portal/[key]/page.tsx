import { notFound } from "next/navigation";
import {
  getEnvAdminEmail,
  isEnvSlugConfigured,
  verifyPortalSlugAccess,
} from "@/lib/store";
import { HiddenAdminPortal } from "@/components/HiddenAdminPortal";

export const dynamic = "force-dynamic";

export default async function SecretAdminPortalPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const access = await verifyPortalSlugAccess(key);

  if (!access.allowed || access.mode === "denied") {
    notFound();
  }

  return (
    <HiddenAdminPortal
      portalKey={key}
      initialMode={access.mode}
      slugControlledByEnv={isEnvSlugConfigured()}
      suggestedEmail={getEnvAdminEmail()}
    />
  );
}
