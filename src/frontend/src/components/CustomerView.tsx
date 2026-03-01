import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Home,
  Info,
  Loader2,
  MapPin,
  Navigation,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Location } from "../backend.d.ts";
import {
  useDeleteLocation,
  useListLocations,
  useSaveLocation,
  useUpdateLocation,
} from "../hooks/useQueries";
import { ConfidenceScore } from "./ConfidenceScore";
import type { LocationMapHandle } from "./LocationMap";
import { LocationMap } from "./LocationMap";
import { OrientationSelector } from "./OrientationSelector";

const DEFAULT_LAT = 20.5937;
const DEFAULT_LNG = 78.9629;
const DEFAULT_ZOOM = 13;

const LABEL_OPTIONS = [
  { value: "Home", icon: Home, color: "text-blue-400" },
  { value: "Work", icon: Briefcase, color: "text-amber-400" },
  { value: "Other", icon: Star, color: "text-purple-400" },
];

function getZoomConfidence(zoom: number): number {
  if (zoom >= 18) return 90;
  if (zoom >= 16) return 75;
  if (zoom >= 14) return 55;
  if (zoom >= 12) return 35;
  return 20;
}

interface LocationFormState {
  locationLabel: string;
  customLabel: string;
  latitude: number;
  longitude: number;
  orientation: string;
  landmarkNotes: string;
  confidenceScore: number;
}

const DEFAULT_FORM: LocationFormState = {
  locationLabel: "Home",
  customLabel: "",
  latitude: DEFAULT_LAT,
  longitude: DEFAULT_LNG,
  orientation: "N",
  landmarkNotes: "",
  confidenceScore: 50,
};

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

// Address Search Bar component
function AddressSearchBar({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setShowDropdown(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=5&addressdetails=1`;
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
        });
        const data: NominatimResult[] = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (result: NominatimResult) => {
    const lat = Number.parseFloat(result.lat);
    const lng = Number.parseFloat(result.lon);
    onSelect(lat, lng);
    setQuery(result.display_name.slice(0, 80));
    setShowDropdown(false);
    setResults([]);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        onSelect(lat, lng);
        setIsLocating(false);
        toast.success("Location updated to your current position");
      },
      () => {
        toast.error(
          "Unable to get your location. Please allow location access.",
        );
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  return (
    <div className="relative flex gap-2 items-center">
      {/* Search input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for your building, area or address..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true);
          }}
          className="pl-9 pr-8 h-10 bg-background border-border focus:border-primary text-sm"
          autoComplete="off"
        />
        {/* Clear / Loading indicator inside input */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* Dropdown results */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-[1000] overflow-hidden"
            >
              {isSearching ? (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  No results found
                </div>
              ) : (
                <div className="py-1 max-h-56 overflow-y-auto">
                  {results.map((result) => (
                    <div key={result.place_id}>
                      <button
                        type="button"
                        className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-primary/10 transition-colors group"
                        onClick={() => handleSelect(result)}
                      >
                        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                          {result.display_name.length > 80
                            ? `${result.display_name.slice(0, 80)}…`
                            : result.display_name}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Use my location button */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0 border-border hover:border-primary/50 hover:bg-primary/10"
        onClick={handleUseMyLocation}
        disabled={isLocating}
        title="Use my current location"
        aria-label="Use my current location"
      >
        {isLocating ? (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        ) : (
          <Navigation className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
        )}
      </Button>
    </div>
  );
}

export function CustomerView() {
  const { data: locations, isLoading } = useListLocations();
  const saveLocation = useSaveLocation();
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<LocationFormState>(DEFAULT_FORM);

  // Ref to the map for programmatic flyTo
  const mapRef = useRef<LocationMapHandle>(null);

  const handleSelectLocation = (loc: Location) => {
    setSelectedLocation(loc);
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleNewLocation = () => {
    setSelectedLocation(null);
    setIsCreating(true);
    setIsEditing(false);
    setForm(DEFAULT_FORM);
  };

  const handleEditLocation = (loc: Location) => {
    const isCustomLabel = !["Home", "Work", "Other"].includes(
      loc.locationLabel,
    );
    setForm({
      locationLabel: isCustomLabel ? "Other" : loc.locationLabel,
      customLabel: isCustomLabel ? loc.locationLabel : "",
      latitude: loc.latitude,
      longitude: loc.longitude,
      orientation: loc.orientation || "N",
      landmarkNotes: loc.landmarkNotes,
      confidenceScore: Number(loc.confidenceScore),
    });
    setSelectedLocation(loc);
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleMapChange = useCallback(
    (lat: number, lng: number, zoom: number) => {
      const suggestedConfidence = getZoomConfidence(zoom);
      setForm((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        confidenceScore: Math.max(prev.confidenceScore, suggestedConfidence),
      }));
    },
    [],
  );

  // Called by AddressSearchBar when user picks a result or uses GPS
  const handleSearchSelect = useCallback((lat: number, lng: number) => {
    setForm((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      confidenceScore: Math.max(prev.confidenceScore, 55),
    }));
    mapRef.current?.flyTo(lat, lng, 16);
  }, []);

  const getEffectiveLabel = () => {
    if (form.locationLabel === "Other" && form.customLabel.trim()) {
      return form.customLabel.trim();
    }
    return form.locationLabel;
  };

  const handleSave = async () => {
    const label = getEffectiveLabel();
    if (!label) {
      toast.error("Please enter a location label");
      return;
    }
    try {
      if (isCreating) {
        await saveLocation.mutateAsync({
          locationLabel: label,
          latitude: form.latitude,
          longitude: form.longitude,
          orientation: form.orientation,
          landmarkNotes: form.landmarkNotes,
          confidenceScore: BigInt(Math.round(form.confidenceScore)),
        });
        toast.success("Location saved successfully!");
        setIsCreating(false);
        setForm(DEFAULT_FORM);
      } else if (isEditing && selectedLocation) {
        await updateLocation.mutateAsync({
          locationId: selectedLocation.id,
          locationLabel: label,
          latitude: form.latitude,
          longitude: form.longitude,
          orientation: form.orientation,
          landmarkNotes: form.landmarkNotes,
          confidenceScore: BigInt(Math.round(form.confidenceScore)),
        });
        toast.success("Location updated!");
        setIsEditing(false);
      }
    } catch {
      toast.error("Failed to save location.");
    }
  };

  const handleDelete = async (loc: Location) => {
    try {
      await deleteLocation.mutateAsync(loc.id);
      toast.success("Location deleted.");
      if (selectedLocation?.id === loc.id) {
        setSelectedLocation(null);
        setIsEditing(false);
      }
    } catch {
      toast.error("Failed to delete location.");
    }
  };

  const isBusy = saveLocation.isPending || updateLocation.isPending;
  const showForm = isCreating || isEditing;
  const showMap = showForm || selectedLocation;

  const mapLat = showForm
    ? form.latitude
    : (selectedLocation?.latitude ?? DEFAULT_LAT);
  const mapLng = showForm
    ? form.longitude
    : (selectedLocation?.longitude ?? DEFAULT_LNG);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <aside className="w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-border bg-card flex flex-col shrink-0">
        {/* Sidebar header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-foreground">
              My Locations
            </h2>
            <Badge
              variant="outline"
              className="font-mono border-border text-muted-foreground"
            >
              {locations?.length ?? 0}
            </Badge>
          </div>
          <Button
            onClick={handleNewLocation}
            className="w-full h-9 font-display font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-2 glow-teal"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            Add New Location
          </Button>
        </div>

        {/* Locations list */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </>
            ) : !locations?.length ? (
              <div className="py-12 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-xl border border-dashed border-border flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    No locations yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add your first delivery location
                  </p>
                </div>
              </div>
            ) : (
              locations.map((loc) => {
                const isActive = selectedLocation?.id === loc.id;
                const labelIcon = LABEL_OPTIONS.find(
                  (l) => l.value === loc.locationLabel,
                );
                const IconComp = labelIcon?.icon ?? Star;
                const iconColor = labelIcon?.color ?? "text-muted-foreground";

                return (
                  <motion.div
                    key={loc.id.toString()}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectLocation(loc)}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left transition-all duration-150 group",
                        isActive
                          ? "border-primary/60 bg-primary/5 glow-teal"
                          : "border-border bg-background hover:border-primary/30 hover:bg-card",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                            isActive ? "bg-primary/15" : "bg-muted",
                          )}
                        >
                          <IconComp className={cn("w-4 h-4", iconColor)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-display font-semibold text-sm text-foreground truncate">
                              {loc.locationLabel}
                            </p>
                            <ConfidenceScore
                              score={Number(loc.confidenceScore)}
                              showLabel={false}
                              size="sm"
                            />
                          </div>
                          <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate">
                            {loc.latitude.toFixed(4)},{" "}
                            {loc.longitude.toFixed(4)}
                          </p>
                          {loc.landmarkNotes && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {loc.landmarkNotes}
                            </p>
                          )}
                        </div>
                        <div
                          className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          role="presentation"
                        >
                          <button
                            type="button"
                            onClick={() => handleEditLocation(loc)}
                            className="w-6 h-6 rounded-md border border-border hover:border-primary/50 hover:bg-primary/10 flex items-center justify-center transition-all"
                          >
                            <Pencil className="w-3 h-3 text-muted-foreground hover:text-primary" />
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                type="button"
                                className="w-6 h-6 rounded-md border border-border hover:border-destructive/50 hover:bg-destructive/10 flex items-center justify-center transition-all"
                              >
                                <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-display">
                                  Delete Location?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  "{loc.locationLabel}" will be permanently
                                  removed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-border">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(loc)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {showMap ? (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Map column */}
            <div className="flex-1 flex flex-col min-h-[250px] lg:min-h-0 overflow-hidden">
              {/* Address search bar — only shown in form mode, above the map */}
              {showForm && (
                <div className="shrink-0 px-3 pt-3 pb-2 bg-background/80 backdrop-blur-sm border-b border-border z-10">
                  <AddressSearchBar onSelect={handleSearchSelect} />
                </div>
              )}

              {/* Map container */}
              <div className="flex-1 relative min-h-0">
                <LocationMap
                  ref={mapRef}
                  latitude={mapLat}
                  longitude={mapLng}
                  draggable={showForm}
                  onPositionChange={handleMapChange}
                  zoom={DEFAULT_ZOOM}
                />
                {/* Coordinate overlay */}
                <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 z-[500]">
                  <p className="font-mono text-xs text-muted-foreground">
                    <span className="text-primary">LAT</span>{" "}
                    {mapLat.toFixed(6)}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    <span className="text-primary">LNG</span>{" "}
                    {mapLng.toFixed(6)}
                  </p>
                </div>
                {showForm && (
                  <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm border border-primary/30 rounded-lg px-3 py-2 z-[500] max-w-48">
                    <p className="text-xs text-primary flex items-center gap-1.5">
                      <Info className="w-3 h-3" />
                      Click map or drag pin to set location
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Form / Details panel */}
            <AnimatePresence mode="wait">
              {showForm ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="w-full lg:w-96 xl:w-[420px] bg-card border-l border-border flex flex-col overflow-hidden"
                >
                  <div className="p-4 border-b border-border">
                    <h3 className="font-display font-bold text-foreground">
                      {isCreating ? "New Location" : "Edit Location"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isCreating
                        ? "Search for your address or drop a pin on the map"
                        : "Update your location details"}
                    </p>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-5">
                      {/* Label */}
                      <div className="space-y-2">
                        <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                          Location Label
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                          {LABEL_OPTIONS.map(({ value, icon: Icon, color }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  locationLabel: value,
                                }))
                              }
                              className={cn(
                                "h-10 rounded-lg border flex items-center justify-center gap-1.5 text-sm font-display font-semibold transition-all",
                                form.locationLabel === value
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                              )}
                            >
                              <Icon
                                className={cn(
                                  "w-4 h-4",
                                  form.locationLabel === value
                                    ? "text-primary"
                                    : color,
                                )}
                              />
                              {value}
                            </button>
                          ))}
                        </div>
                        {form.locationLabel === "Other" && (
                          <Input
                            placeholder="Custom label (e.g. Gym, Hospital)"
                            value={form.customLabel}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                customLabel: e.target.value,
                              }))
                            }
                            className="mt-2 h-9 bg-background border-border focus:border-primary"
                          />
                        )}
                      </div>

                      {/* Orientation */}
                      <OrientationSelector
                        value={form.orientation}
                        onChange={(v) =>
                          setForm((prev) => ({ ...prev, orientation: v }))
                        }
                      />

                      {/* Landmark Notes */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="landmarks"
                          className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
                        >
                          Landmark Notes
                        </Label>
                        <Textarea
                          id="landmarks"
                          placeholder="e.g. Blue gate, next to SBI ATM, 3rd floor left wing..."
                          value={form.landmarkNotes}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              landmarkNotes: e.target.value,
                            }))
                          }
                          className="bg-background border-border focus:border-primary resize-none"
                          rows={3}
                        />
                      </div>

                      {/* Confidence Score */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                            Confidence Score
                          </Label>
                          <span className="text-xs text-muted-foreground font-mono">
                            Auto-adjusts with zoom
                          </span>
                        </div>
                        <ConfidenceScore score={form.confidenceScore} />
                        <Slider
                          value={[form.confidenceScore]}
                          onValueChange={([v]) =>
                            setForm((prev) => ({
                              ...prev,
                              confidenceScore: v,
                            }))
                          }
                          min={0}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </ScrollArea>

                  {/* Actions */}
                  <div className="p-4 border-t border-border flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreating(false);
                        setIsEditing(false);
                      }}
                      className="flex-1 border-border"
                      disabled={isBusy}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isBusy}
                      className="flex-[2] font-display font-semibold bg-primary text-primary-foreground hover:bg-primary/90 glow-teal"
                    >
                      {isBusy ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </span>
                      ) : isCreating ? (
                        "Save Location"
                      ) : (
                        "Update Location"
                      )}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                selectedLocation && (
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="w-full lg:w-96 xl:w-[420px] bg-card border-l border-border flex flex-col"
                  >
                    <div className="p-4 border-b border-border">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-display font-bold text-foreground text-lg">
                            {selectedLocation.locationLabel}
                          </h3>
                          <p className="font-mono text-xs text-muted-foreground mt-1">
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
                    </div>

                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-background rounded-lg border border-border p-3">
                          <p className="text-xs font-mono text-muted-foreground mb-1 uppercase tracking-wider">
                            Entrance
                          </p>
                          <p className="font-display font-semibold text-foreground text-lg">
                            {selectedLocation.orientation || "—"}
                          </p>
                        </div>
                        <div className="bg-background rounded-lg border border-border p-3">
                          <p className="text-xs font-mono text-muted-foreground mb-1 uppercase tracking-wider">
                            Confidence
                          </p>
                          <p className="font-display font-semibold text-foreground text-lg">
                            {String(selectedLocation.confidenceScore)}%
                          </p>
                        </div>
                      </div>

                      {selectedLocation.landmarkNotes && (
                        <div className="bg-background rounded-lg border border-border p-3">
                          <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">
                            Landmarks
                          </p>
                          <p className="text-sm text-foreground leading-relaxed">
                            {selectedLocation.landmarkNotes}
                          </p>
                        </div>
                      )}

                      <ConfidenceScore
                        score={Number(selectedLocation.confidenceScore)}
                      />
                    </div>

                    <div className="mt-auto p-4 border-t border-border flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditLocation(selectedLocation)}
                        className="flex-1 border-border gap-1.5"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-display">
                              Delete Location?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              "{selectedLocation.locationLabel}" will be
                              permanently removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-border">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(selectedLocation)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="max-w-sm"
            >
              <div className="w-16 h-16 rounded-2xl border border-dashed border-primary/40 flex items-center justify-center mx-auto mb-6 bg-primary/5">
                <MapPin className="w-8 h-8 text-primary/60" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-2">
                {(locations?.length ?? 0) > 0
                  ? "Select a location"
                  : "No locations yet"}
              </h3>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                {(locations?.length ?? 0) > 0
                  ? "Click a location from the sidebar to view details, or add a new one."
                  : "Add precise delivery locations with landmarks and directions for faster, more accurate deliveries."}
              </p>
              <Button
                onClick={handleNewLocation}
                className="font-display font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-2 glow-teal"
              >
                <Plus className="w-4 h-4" />
                Add Your First Location
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
