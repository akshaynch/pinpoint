import { Toaster } from "@/components/ui/sonner";
import { useEffect, useRef, useState } from "react";
import { AdminPanel } from "./components/AdminPanel";
import { AppNav } from "./components/AppNav";
import { CustomerView } from "./components/CustomerView";
import { LoginPage } from "./components/LoginPage";
import { OnboardingPage } from "./components/OnboardingPage";
import { RiderView } from "./components/RiderView";
import { AppRole } from "./constants";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useCallerUserProfile, useIsCallerAdmin } from "./hooks/useQueries";

function AppContent() {
  const { identity, loginStatus } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const [activeView, setActiveView] = useState<string>(
    profile?.appRole ?? AppRole.Customer,
  );
  // Sync activeView once when the profile first loads (so Rider users start on Rider view)
  const didSyncRole = useRef(false);
  useEffect(() => {
    if (!didSyncRole.current && profile?.appRole) {
      didSyncRole.current = true;
      setActiveView(profile.appRole);
    }
  }, [profile?.appRole]);

  const isLoggedIn =
    !!identity && (loginStatus === "success" || loginStatus === "idle");
  const isInitializing = loginStatus === "initializing";
  const isLoggingIn = loginStatus === "logging-in";

  if (isInitializing || isLoggingIn) {
    return (
      <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm font-mono">
            {isLoggingIn ? "Logging in..." : "Initializing..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm font-mono">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (!profile || !profile.appRole) {
    return <OnboardingPage />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNav
        profile={profile}
        isAdmin={isAdmin ?? false}
        activeView={activeView}
        onSwitchView={setActiveView}
      />
      <main className="flex-1 flex flex-col">
        {activeView === AppRole.Customer && <CustomerView />}
        {activeView === AppRole.Rider && <RiderView />}
        {isAdmin && (
          <div className="border-t border-border">
            <AdminPanel />
          </div>
        )}
      </main>
      <footer className="border-t border-border py-4 px-6 text-center">
        <p className="text-muted-foreground text-xs font-mono">
          © {new Date().getFullYear()} PinPoint — Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <>
      <AppContent />
      <Toaster theme="dark" position="bottom-right" />
    </>
  );
}
