import { TopAppBar } from "@/components/shared/top-app-bar";
import { BottomNav } from "@/components/shared/bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden pb-24 md:pb-0">
      <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-surface-container-high via-surface to-surface-container-highest opacity-70" />
      <TopAppBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-stack-md">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
