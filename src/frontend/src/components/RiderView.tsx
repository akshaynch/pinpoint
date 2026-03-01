import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Bike,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MapPin,
  Navigation,
  Package,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Location, Verification } from "../backend.d.ts";
import {
  useConfirmPickup,
  useListLocations,
  useListVerifications,
} from "../hooks/useQueries";
import { ConfidenceScore } from "./ConfidenceScore";
import { LocationMap } from "./LocationMap";

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "pickup":
      return (
        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
          Picked Up
        </Badge>
      );
    case "dropoff":
      return (
        <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30">
          Dropped Off
        </Badge>
      );
    default:
      return (
        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">
          Pending
        </Badge>
      );
  }
}

function formatTimestamp(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000; // nanoseconds to ms
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RiderView() {
  const { data: verifications, isLoading } = useListVerifications();
  const { data: locations } = useListLocations();
  const confirmPickup = useConfirmPickup();

  const [selected, setSelected] = useState<Verification | null>(null);

  const getLocation = (locationId: bigint): Location | undefined =>
    locations?.find((l) => l.id === locationId);

  const handleConfirm = async (status: "pickup" | "dropoff") => {
    if (!selected) return;
    try {
      await confirmPickup.mutateAsync({
        locationId: selected.locationId,
        status,
      });
      toast.success(
        status === "pickup" ? "Pickup confirmed!" : "Dropoff confirmed!",
      );
      setSelected((prev) => (prev ? { ...prev, status } : null));
    } catch {
      toast.error("Failed to confirm status.");
    }
  };

  const selectedLocation = selected ? getLocation(selected.locationId) : null;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <aside
        className={cn(
          "w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-border bg-card flex flex-col shrink-0",
          selected ? "hidden lg:flex" : "flex",
        )}
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <Bike className="w-4 h-4 text-primary" />
            <h2 className="font-display font-bold text-foreground">
              My Deliveries
            </h2>
            <Badge
              variant="outline"
              className="ml-auto font-mono border-border text-muted-foreground"
            >
              {verifications?.length ?? 0}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Tap a delivery to view location details
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </>
            ) : !verifications?.length ? (
              <div className="py-12 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-xl border border-dashed border-border flex items-center justify-center">
                  <Package className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    No deliveries assigned
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Waiting for dispatch assignment
                  </p>
                </div>
              </div>
            ) : (
              verifications.map((v) => {
                const loc = getLocation(v.locationId);
                const isActive = selected?.id === v.id;

                return (
                  <motion.button
                    key={v.id.toString()}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    type="button"
                    onClick={() => setSelected(v)}
                    className={cn(
                      "w-full p-3 rounded-lg border text-left transition-all duration-150",
                      isActive
                        ? "border-primary/60 bg-primary/5 glow-teal"
                        : "border-border bg-background hover:border-primary/30 hover:bg-card",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                          isActive ? "bg-primary/15" : "bg-muted",
                        )}
                      >
                        <MapPin
                          className={cn(
                            "w-4 h-4",
                            isActive ? "text-primary" : "text-muted-foreground",
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-display font-semibold text-sm text-foreground">
                            {loc?.locationLabel ?? `Order #${v.locationId}`}
                          </p>
                          {getStatusBadge(v.status)}
                        </div>
                        <p className="text-xs font-mono text-muted-foreground mt-1">
                          {loc
                            ? `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`
                            : `Location ID: ${v.locationId}`}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">
                            {formatTimestamp(v.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Main detail view */}
      <div
        className={cn(
          "flex-1 flex flex-col overflow-hidden",
          !selected ? "hidden lg:flex" : "flex",
        )}
      >
        <AnimatePresence mode="wait">
          {!selected ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12"
            >
              <div className="w-16 h-16 rounded-2xl border border-dashed border-primary/40 flex items-center justify-center mx-auto mb-6 bg-primary/5">
                <Bike className="w-8 h-8 text-primary/60" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-2">
                Select a delivery
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Choose a delivery from the list to view the precise location and
                confirm pickup or dropoff.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={selected.id.toString()}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Mobile back button */}
              <div className="lg:hidden p-3 border-b border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelected(null)}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to deliveries
                </Button>
              </div>

              {/* Map section */}
              <div className="flex-1 relative min-h-[250px] lg:min-h-0">
                <LocationMap
                  latitude={selectedLocation?.latitude ?? 20.5937}
                  longitude={selectedLocation?.longitude ?? 78.9629}
                  draggable={false}
                  zoom={16}
                />
                {/* Status overlay */}
                <div className="absolute top-3 right-3 z-[500]">
                  {getStatusBadge(selected.status)}
                </div>
              </div>

              {/* Info panel */}
              <div className="border-t border-border bg-card">
                <div className="p-4">
                  {selectedLocation ? (
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display font-bold text-xl text-foreground">
                            {selectedLocation.locationLabel}
                          </h3>
                          <p className="font-mono text-xs text-muted-foreground mt-0.5">
                            {selectedLocation.latitude.toFixed(6)},{" "}
                            {selectedLocation.longitude.toFixed(6)}
                          </p>
                        </div>
                        <ConfidenceScore
                          score={Number(selectedLocation.confidenceScore)}
                          showLabel={false}
                          size="sm"
                        />
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="bg-background rounded-lg border border-border p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Navigation className="w-3 h-3 text-primary" />
                            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                              Entrance
                            </span>
                          </div>
                          <p className="font-display font-bold text-lg text-foreground">
                            {selectedLocation.orientation || "—"}
                          </p>
                        </div>

                        <div className="bg-background rounded-lg border border-border p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <CheckCircle2 className="w-3 h-3 text-primary" />
                            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                              Confidence
                            </span>
                          </div>
                          <p className="font-display font-bold text-lg text-foreground">
                            {String(selectedLocation.confidenceScore)}%
                          </p>
                        </div>

                        <div className="bg-background rounded-lg border border-border p-3 col-span-2 sm:col-span-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Clock className="w-3 h-3 text-primary" />
                            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                              Assigned
                            </span>
                          </div>
                          <p className="font-display font-semibold text-sm text-foreground">
                            {formatTimestamp(selected.timestamp)}
                          </p>
                        </div>
                      </div>

                      {selectedLocation.landmarkNotes && (
                        <div className="bg-background rounded-lg border border-border p-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <FileText className="w-3 h-3 text-primary" />
                            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                              Landmarks
                            </span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">
                            {selectedLocation.landmarkNotes}
                          </p>
                        </div>
                      )}

                      <ConfidenceScore
                        score={Number(selectedLocation.confidenceScore)}
                      />

                      <Separator className="bg-border" />

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => handleConfirm("pickup")}
                          disabled={
                            confirmPickup.isPending ||
                            selected.status === "pickup" ||
                            selected.status === "dropoff"
                          }
                          className={cn(
                            "h-11 font-display font-semibold gap-2",
                            selected.status === "pickup" ||
                              selected.status === "dropoff"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 cursor-not-allowed"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white",
                          )}
                          variant={
                            selected.status === "pickup" ||
                            selected.status === "dropoff"
                              ? "outline"
                              : "default"
                          }
                        >
                          {confirmPickup.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Package className="w-4 h-4" />
                          )}
                          {selected.status === "pickup"
                            ? "Picked Up ✓"
                            : "Confirm Pickup"}
                        </Button>

                        <Button
                          onClick={() => handleConfirm("dropoff")}
                          disabled={
                            confirmPickup.isPending ||
                            selected.status === "dropoff"
                          }
                          className={cn(
                            "h-11 font-display font-semibold gap-2",
                            selected.status === "dropoff"
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/30 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 text-white",
                          )}
                          variant={
                            selected.status === "dropoff"
                              ? "outline"
                              : "default"
                          }
                        >
                          {confirmPickup.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          {selected.status === "dropoff"
                            ? "Dropped Off ✓"
                            : "Confirm Dropoff"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground text-sm">
                        Location details not available. Contact dispatch.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
