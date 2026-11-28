import { ProtectedPageShell } from "@/components/ProtectedPageShell";
import { ProfileTabView } from "@/components/ProfileTabView";

export default function ProfilePage() {
  return (
    <ProtectedPageShell
      tab="profile"
      title="Account Profile"
      subtitle="Sign in to view your Akvai Associates account details, active bookings, and sign-out controls."
    >
      <ProfileTabView />
    </ProtectedPageShell>
  );
}
