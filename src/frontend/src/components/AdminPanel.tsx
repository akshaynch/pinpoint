import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Principal } from "@dfinity/principal";
import { ClipboardList, Loader2, MapPin, Shield, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { AppRole } from "../constants";
import {
  useAllLocations,
  useAllVerifications,
  useAssignAppRole,
  useAssignLocationToRider,
} from "../hooks/useQueries";
import { ConfidenceScore } from "./ConfidenceScore";

export function AdminPanel() {
  const { data: locations, isLoading: locsLoading } = useAllLocations();
  const { data: verifications, isLoading: versLoading } = useAllVerifications();
  const assignRole = useAssignAppRole();
  const assignToRider = useAssignLocationToRider();

  const [rolePrincipal, setRolePrincipal] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");
  const [assignLocId, setAssignLocId] = useState("");
  const [riderPrincipal, setRiderPrincipal] = useState("");

  const handleAssignRole = async () => {
    if (!rolePrincipal.trim() || !selectedRole) {
      toast.error("Please fill in both Principal and Role");
      return;
    }
    try {
      const principal = Principal.fromText(rolePrincipal.trim());
      await assignRole.mutateAsync({ user: principal, role: selectedRole });
      toast.success(`Role "${selectedRole}" assigned successfully`);
      setRolePrincipal("");
      setSelectedRole("");
    } catch {
      toast.error("Invalid Principal or assignment failed");
    }
  };

  const handleAssignToRider = async () => {
    if (!assignLocId.trim() || !riderPrincipal.trim()) {
      toast.error("Please fill in both Location ID and Rider Principal");
      return;
    }
    try {
      const locationId = BigInt(assignLocId.trim());
      const principal = Principal.fromText(riderPrincipal.trim());
      await assignToRider.mutateAsync({ locationId, riderId: principal });
      toast.success("Location assigned to rider");
      setAssignLocId("");
      setRiderPrincipal("");
    } catch {
      toast.error("Assignment failed. Check inputs.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
          <Shield className="w-4 h-4 text-yellow-400" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg text-foreground">
            Admin Panel
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage roles, locations, and verifications
          </p>
        </div>
      </div>

      <Tabs defaultValue="roles">
        <TabsList className="bg-card border border-border mb-6">
          <TabsTrigger
            value="roles"
            className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <Users className="w-3.5 h-3.5" />
            Assign Roles
          </TabsTrigger>
          <TabsTrigger
            value="assign"
            className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <MapPin className="w-3.5 h-3.5" />
            Assign Delivery
          </TabsTrigger>
          <TabsTrigger
            value="locations"
            className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <MapPin className="w-3.5 h-3.5" />
            All Locations
          </TabsTrigger>
          <TabsTrigger
            value="verifications"
            className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Verifications
          </TabsTrigger>
        </TabsList>

        {/* Assign Roles */}
        <TabsContent value="roles">
          <div className="bg-card border border-border rounded-xl p-5 max-w-lg">
            <h3 className="font-display font-semibold text-foreground mb-4">
              Assign App Role to User
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Principal ID
                </Label>
                <Input
                  placeholder="e.g. xhcs4-iaaaa-aaaab-qab3q-cai"
                  value={rolePrincipal}
                  onChange={(e) => setRolePrincipal(e.target.value)}
                  className="h-10 bg-background border-border focus:border-primary font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  App Role
                </Label>
                <Select
                  value={selectedRole}
                  onValueChange={(v) => setSelectedRole(v as AppRole)}
                >
                  <SelectTrigger className="h-10 bg-background border-border">
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value={AppRole.Customer}>Customer</SelectItem>
                    <SelectItem value={AppRole.Rider}>Rider</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAssignRole}
                disabled={
                  assignRole.isPending || !rolePrincipal || !selectedRole
                }
                className="w-full font-display font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 hover:bg-yellow-500/30"
                variant="outline"
              >
                {assignRole.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Assigning...
                  </span>
                ) : (
                  "Assign Role"
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Assign Location to Rider */}
        <TabsContent value="assign">
          <div className="bg-card border border-border rounded-xl p-5 max-w-lg">
            <h3 className="font-display font-semibold text-foreground mb-4">
              Assign Location to Rider
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Location ID
                </Label>
                <Input
                  placeholder="e.g. 1"
                  value={assignLocId}
                  onChange={(e) => setAssignLocId(e.target.value)}
                  className="h-10 bg-background border-border focus:border-primary font-mono text-sm"
                  type="number"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Rider Principal ID
                </Label>
                <Input
                  placeholder="e.g. xhcs4-iaaaa-aaaab-qab3q-cai"
                  value={riderPrincipal}
                  onChange={(e) => setRiderPrincipal(e.target.value)}
                  className="h-10 bg-background border-border focus:border-primary font-mono text-sm"
                />
              </div>

              <Button
                onClick={handleAssignToRider}
                disabled={
                  assignToRider.isPending || !assignLocId || !riderPrincipal
                }
                className="w-full font-display font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 hover:bg-yellow-500/30"
                variant="outline"
              >
                {assignToRider.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Assigning...
                  </span>
                ) : (
                  "Assign to Rider"
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* All Locations */}
        <TabsContent value="locations">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-display font-semibold text-foreground">
                All Locations
              </h3>
              <Badge
                variant="outline"
                className="font-mono border-border text-muted-foreground"
              >
                {locations?.length ?? 0} total
              </Badge>
            </div>
            <ScrollArea className="max-h-96">
              {locsLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !locations?.length ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No locations found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground font-mono text-xs uppercase">
                        ID
                      </TableHead>
                      <TableHead className="text-muted-foreground font-mono text-xs uppercase">
                        Label
                      </TableHead>
                      <TableHead className="text-muted-foreground font-mono text-xs uppercase hidden md:table-cell">
                        Coordinates
                      </TableHead>
                      <TableHead className="text-muted-foreground font-mono text-xs uppercase hidden lg:table-cell">
                        Orientation
                      </TableHead>
                      <TableHead className="text-muted-foreground font-mono text-xs uppercase">
                        Confidence
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations.map((loc) => (
                      <TableRow
                        key={loc.id.toString()}
                        className="border-border hover:bg-muted/30"
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          #{loc.id.toString()}
                        </TableCell>
                        <TableCell className="font-display font-semibold text-sm text-foreground">
                          {loc.locationLabel}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground hidden md:table-cell">
                          {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-foreground hidden lg:table-cell">
                          {loc.orientation || "—"}
                        </TableCell>
                        <TableCell>
                          <ConfidenceScore
                            score={Number(loc.confidenceScore)}
                            showLabel={false}
                            size="sm"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </div>
        </TabsContent>

        {/* All Verifications */}
        <TabsContent value="verifications">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-display font-semibold text-foreground">
                All Verifications
              </h3>
              <Badge
                variant="outline"
                className="font-mono border-border text-muted-foreground"
              >
                {verifications?.length ?? 0} total
              </Badge>
            </div>
            <ScrollArea className="max-h-96">
              {versLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !verifications?.length ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No verifications found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground font-mono text-xs uppercase">
                        ID
                      </TableHead>
                      <TableHead className="text-muted-foreground font-mono text-xs uppercase">
                        Location ID
                      </TableHead>
                      <TableHead className="text-muted-foreground font-mono text-xs uppercase">
                        Status
                      </TableHead>
                      <TableHead className="text-muted-foreground font-mono text-xs uppercase hidden md:table-cell">
                        Rider
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {verifications.map((v) => (
                      <TableRow
                        key={v.id.toString()}
                        className="border-border hover:bg-muted/30"
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          #{v.id.toString()}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-foreground">
                          {v.locationId.toString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              v.status === "pickup"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : v.status === "dropoff"
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            }
                          >
                            {v.status || "pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground hidden md:table-cell max-w-32 truncate">
                          {v.rider?.toString()?.slice(0, 12)}...
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
