import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/bottom-nav";
import TopBar from "@/components/top-bar";
import SideNav from "@/components/side-nav";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Sidebar — desktop only */}
      <SideNav profile={profile} />

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar — mobile only */}
        <div className="md:hidden">
          <TopBar profile={profile} />
        </div>

        <main className="flex-1 overflow-y-auto pb-safe md:pb-8">
          <div className="md:max-w-4xl md:mx-auto">
            {children}
          </div>
        </main>

        {/* Bottom nav — mobile only */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
