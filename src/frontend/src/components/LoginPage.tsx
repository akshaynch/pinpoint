import { Button } from "@/components/ui/button";
import { Crosshair, MapPin, Navigation, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background grid-bg flex flex-col">
      {/* Decorative corner elements */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-primary/30 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-primary/30 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-primary/30 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-primary/30 rounded-br-lg" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-md w-full"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center glow-teal">
              <Crosshair className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-gradient-teal tracking-tight">
                PinPoint
              </h1>
              <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
                Location Intelligence
              </p>
            </div>
          </div>

          {/* Headline */}
          <div className="text-center mb-10">
            <h2 className="text-2xl font-display font-semibold text-foreground mb-3 leading-tight">
              Precision delivery,
              <br />
              every time.
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Drop exact pins, add landmarks, and verify pickups across Zomato,
              Blinkit, Uber, and Rapido.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 mb-10">
            {[
              {
                icon: MapPin,
                label: "Precise Pins",
                desc: "Sub-meter accuracy",
              },
              {
                icon: Navigation,
                label: "Orientation",
                desc: "Building entry guide",
              },
              {
                icon: Shield,
                label: "Verified",
                desc: "Rider confirmation",
              },
            ].map(({ icon: Icon, label, desc }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-card border border-border text-center"
              >
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-display font-semibold text-foreground">
                  {label}
                </span>
                <span className="text-xs text-muted-foreground">{desc}</span>
              </motion.div>
            ))}
          </div>

          {/* Login Button */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="w-full h-12 text-base font-display font-semibold bg-primary text-primary-foreground hover:bg-primary/90 glow-teal transition-all duration-200"
              size="lg"
            >
              {isLoggingIn ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Connecting...
                </span>
              ) : (
                "Connect with Internet Identity"
              )}
            </Button>
          </motion.div>

          <p className="text-center text-xs text-muted-foreground mt-4 font-mono">
            Secured by the Internet Computer Protocol
          </p>
        </motion.div>
      </div>

      <footer className="py-4 text-center">
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
