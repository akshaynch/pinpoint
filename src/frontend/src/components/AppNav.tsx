import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bike,
  ChevronDown,
  Crosshair,
  LogOut,
  Shield,
  User,
} from "lucide-react";
import type { UserProfile } from "../backend.d.ts";
import { AppRole } from "../constants";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface AppNavProps {
  profile: UserProfile;
  isAdmin: boolean;
  activeView: string;
  onSwitchView: (view: string) => void;
}

export function AppNav({
  profile,
  isAdmin,
  activeView,
  onSwitchView,
}: AppNavProps) {
  const { clear, identity } = useInternetIdentity();

  const principal = identity?.getPrincipal().toString();
  const shortPrincipal = principal
    ? `${principal.slice(0, 6)}...${principal.slice(-4)}`
    : "";

  const isCustomerActive = activeView === AppRole.Customer;
  const isRiderActive = activeView === AppRole.Rider;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Crosshair className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-base text-gradient-teal hidden sm:block">
            PinPoint
          </span>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Badge
              variant="outline"
              className="border-yellow-500/40 text-yellow-400 bg-yellow-500/10 hidden sm:flex items-center gap-1"
            >
              <Shield className="w-3 h-3" />
              Admin
            </Badge>
          )}

          {/* Role switcher pill */}
          <div className="flex items-center rounded-full border border-border bg-muted/40 p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => onSwitchView(AppRole.Customer)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                isCustomerActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={isCustomerActive}
              aria-label="Switch to Customer view"
            >
              <User className="w-3 h-3" />
              <span className="hidden xs:block">Customer</span>
            </button>
            <button
              type="button"
              onClick={() => onSwitchView(AppRole.Rider)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                isRiderActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={isRiderActive}
              aria-label="Switch to Rider view"
            >
              <Bike className="w-3 h-3" />
              <span className="hidden xs:block">Rider</span>
            </button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 pl-2 pr-3 gap-2 hover:bg-card border border-transparent hover:border-border"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground hidden sm:block max-w-24 truncate">
                  {profile.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-card border-border"
            >
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium text-foreground">
                  {profile.name}
                </p>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  {shortPrincipal}
                </p>
              </div>
              <DropdownMenuItem
                onClick={clear}
                className="text-destructive focus:text-destructive cursor-pointer mt-1"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
