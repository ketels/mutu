import { type ReactNode } from "react";
import { BottomNav } from "@/components/nav/BottomNav";
import { TopNav } from "@/components/nav/TopNav";
import { JoinTokenRedeemer } from "@/components/JoinTokenRedeemer";
import { OnboardingGate } from "@/components/OnboardingGate";
import { ToastProvider } from "@/components/ui/Toast";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <OnboardingGate />
      <JoinTokenRedeemer />
      <TopNav />
      <main className="mx-auto w-full max-w-6xl flex-1 pb-24 md:px-12 md:pb-16">
        {children}
      </main>
      <BottomNav />
    </ToastProvider>
  );
}
