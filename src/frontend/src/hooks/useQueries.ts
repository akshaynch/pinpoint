import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Location,
  UserProfile,
  UserRole,
  Verification,
} from "../backend.d.ts";
import type { AppRole } from "../constants";
import { useActor } from "./useActor";

// ─── User Profile ────────────────────────────────────────────────────────────

export function useCallerUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["callerUserProfile"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getCallerUserProfile();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      // Ensure user is registered in access control first (safety net)
      try {
        await (actor as any)._initializeAccessControlWithSecret("");
      } catch {
        // Ignore - user may already be registered
      }
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerUserProfile"] });
    },
  });
}

// ─── Locations ───────────────────────────────────────────────────────────────

export function useListLocations() {
  const { actor, isFetching } = useActor();
  return useQuery<Location[]>({
    queryKey: ["locations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listLocations();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllLocations() {
  const { actor, isFetching } = useActor();
  return useQuery<Location[]>({
    queryKey: ["allLocations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllLocations();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveLocation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      locationLabel: string;
      latitude: number;
      longitude: number;
      orientation: string;
      landmarkNotes: string;
      confidenceScore: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveLocation(
        params.locationLabel,
        params.latitude,
        params.longitude,
        params.orientation,
        params.landmarkNotes,
        params.confidenceScore,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      qc.invalidateQueries({ queryKey: ["allLocations"] });
    },
  });
}

export function useUpdateLocation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      locationId: bigint;
      locationLabel: string;
      latitude: number;
      longitude: number;
      orientation: string;
      landmarkNotes: string;
      confidenceScore: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateLocation(
        params.locationId,
        params.locationLabel,
        params.latitude,
        params.longitude,
        params.orientation,
        params.landmarkNotes,
        params.confidenceScore,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      qc.invalidateQueries({ queryKey: ["allLocations"] });
    },
  });
}

export function useDeleteLocation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (locationId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteLocation(locationId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locations"] });
      qc.invalidateQueries({ queryKey: ["allLocations"] });
    },
  });
}

// ─── Verifications ───────────────────────────────────────────────────────────

export function useListVerifications() {
  const { actor, isFetching } = useActor();
  return useQuery<Verification[]>({
    queryKey: ["verifications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listVerifications();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllVerifications() {
  const { actor, isFetching } = useActor();
  return useQuery<Verification[]>({
    queryKey: ["allVerifications"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVerifications();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useConfirmPickup() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { locationId: bigint; status: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.confirmPickup(params.locationId, params.status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["verifications"] });
      qc.invalidateQueries({ queryKey: ["allVerifications"] });
    },
  });
}

export function useAssignLocationToRider() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      locationId: bigint;
      riderId: Principal;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.assignLocationToRider(params.locationId, params.riderId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["verifications"] });
    },
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useAssignAppRole() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { user: Principal; role: AppRole }) => {
      if (!actor) throw new Error("Not connected");
      return actor.assignAppRole(params.user, params.role);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerUserProfile"] });
    },
  });
}

export function useAssignCallerUserRole() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (params: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error("Not connected");
      return actor.assignCallerUserRole(params.user, params.role);
    },
  });
}
