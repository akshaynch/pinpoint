import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Location {
    id: bigint;
    latitude: number;
    owner: Principal;
    confidenceScore: bigint;
    longitude: number;
    locationLabel: string;
    landmarkNotes: string;
    orientation: string;
}
export type Time = bigint;
export interface UserProfile {
    appRole?: AppRole;
    name: string;
}
export interface Verification {
    id: bigint;
    status: string;
    locationId: bigint;
    timestamp: Time;
    rider: Principal;
}
export enum AppRole {
    Customer = "Customer",
    Rider = "Rider"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignAppRole(user: Principal, role: AppRole): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignLocationToRider(locationId: bigint, riderId: Principal): Promise<void>;
    confirmPickup(locationId: bigint, status: string): Promise<bigint>;
    deleteLocation(locationId: bigint): Promise<void>;
    getAllLocations(): Promise<Array<Location>>;
    getAllVerifications(): Promise<Array<Verification>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getLocation(locationId: bigint): Promise<Location>;
    getLocationAssignments(): Promise<Array<[bigint, Principal]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listLocations(): Promise<Array<Location>>;
    listVerifications(): Promise<Array<Verification>>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveLocation(locationLabel: string, latitude: number, longitude: number, orientation: string, landmarkNotes: string, confidenceScore: bigint): Promise<bigint>;
    updateLocation(locationId: bigint, locationLabel: string, latitude: number, longitude: number, orientation: string, landmarkNotes: string, confidenceScore: bigint): Promise<void>;
}
