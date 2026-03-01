import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ArrowRight, Bike, Crosshair, ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { AppRole } from "../constants";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

export function OnboardingPage() {
  const [step, setStep] = useState<"name" | "role">("name");
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const saveProfile = useSaveCallerUserProfile();

  const handleNameNext = () => {
    if (!name.trim()) return;
    setStep("role");
  };

  const handleRoleSubmit = async () => {
    if (!selectedRole || !name.trim()) return;
    try {
      await saveProfile.mutateAsync({
        name: name.trim(),
        appRole: selectedRole,
      });
      toast.success("Profile saved! Welcome to PinPoint.");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  const roles = [
    {
      value: AppRole.Customer,
      icon: ShoppingBag,
      label: "I'm a Customer",
      desc: "Set precise pickup & delivery locations for your orders",
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/30",
      borderSelected: "border-primary",
      bgSelected: "bg-primary/15",
    },
    {
      value: AppRole.Rider,
      icon: Bike,
      label: "I'm a Rider",
      desc: "View delivery locations and verify pickups on the go",
      color: "text-accent-foreground",
      bg: "bg-accent/30",
      border: "border-accent/30",
      borderSelected: "border-accent-foreground",
      bgSelected: "bg-accent/50",
    },
  ];

  return (
    <div className="min-h-screen bg-background grid-bg flex flex-col items-center justify-center px-6 py-12">
      {/* Top corner brackets */}
      <div className="absolute top-0 left-0 w-24 h-24 border-l-2 border-t-2 border-primary/20 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-24 h-24 border-r-2 border-t-2 border-primary/20 rounded-tr-lg" />

      <div className="max-w-lg w-full relative z-10">
        {/* Logo bar */}
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Crosshair className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-lg text-gradient-teal">
            PinPoint
          </span>
        </div>

        <AnimatePresence mode="wait">
          {step === "name" ? (
            <motion.div
              key="name-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <p className="text-xs font-mono text-primary uppercase tracking-widest mb-2">
                  Step 1 of 2
                </p>
                <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                  What's your name?
                </h2>
                <p className="text-muted-foreground text-sm">
                  This helps riders and customers identify you.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
                  >
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNameNext()}
                    placeholder="e.g. Arjun Sharma"
                    className="h-12 bg-card border-border text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary"
                    autoFocus
                  />
                </div>

                <Button
                  onClick={handleNameNext}
                  disabled={!name.trim()}
                  className="w-full h-12 font-display font-semibold bg-primary text-primary-foreground hover:bg-primary/90 glow-teal"
                  size="lg"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="role-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-8">
                <p className="text-xs font-mono text-primary uppercase tracking-widest mb-2">
                  Step 2 of 2
                </p>
                <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                  How will you use PinPoint?
                </h2>
                <p className="text-muted-foreground text-sm">
                  Hi{" "}
                  <span className="text-foreground font-semibold">{name}</span>!
                  Choose your role to get started.
                </p>
              </div>

              <div className="grid gap-4 mb-6">
                {roles.map(
                  ({
                    value,
                    icon: Icon,
                    label,
                    desc,
                    color,
                    bg,
                    border,
                    borderSelected,
                    bgSelected,
                  }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedRole(value)}
                      className={cn(
                        "w-full p-5 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer",
                        selectedRole === value
                          ? `${borderSelected} ${bgSelected} glow-teal`
                          : `${border} bg-card hover:${bgSelected}`,
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                            bg,
                          )}
                        >
                          <Icon className={cn("w-6 h-6", color)} />
                        </div>
                        <div>
                          <h3 className="font-display font-semibold text-foreground text-lg mb-1">
                            {label}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {desc}
                          </p>
                        </div>
                        {selectedRole === value && (
                          <div className="ml-auto shrink-0">
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <svg
                                className="w-3 h-3 text-primary-foreground"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                                aria-hidden="true"
                              >
                                <title>Selected</title>
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  ),
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("name")}
                  className="flex-1 h-12 border-border text-muted-foreground hover:text-foreground"
                >
                  Back
                </Button>
                <Button
                  onClick={handleRoleSubmit}
                  disabled={!selectedRole || saveProfile.isPending}
                  className="flex-[2] h-12 font-display font-semibold bg-primary text-primary-foreground hover:bg-primary/90 glow-teal"
                >
                  {saveProfile.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Get Started"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
