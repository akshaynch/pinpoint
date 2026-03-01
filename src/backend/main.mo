import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type AppRole = { #Customer; #Rider };
  public type UserProfile = { name : Text; appRole : ?AppRole };

  public type Location = {
    id : Nat;
    owner : Principal;
    locationLabel : Text;
    latitude : Float;
    longitude : Float;
    orientation : Text;
    landmarkNotes : Text;
    confidenceScore : Nat;
  };

  public type Verification = {
    id : Nat;
    locationId : Nat;
    rider : Principal;
    timestamp : Time.Time;
    status : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let locations = Map.empty<Nat, Location>();
  let verifications = Map.empty<Nat, Verification>();
  let locationAssignments = Map.empty<Nat, Principal>();

  var nextLocationId : Nat = 0;
  var nextVerificationId : Nat = 0;

  func getAppRole(user : Principal) : ?AppRole {
    switch (userProfiles.get(user)) {
      case (null) { null };
      case (?profile) { profile.appRole };
    };
  };

  func isCustomer(user : Principal) : Bool {
    switch (getAppRole(user)) {
      case (?#Customer) { true };
      case (_) { false };
    };
  };

  func isRider(user : Principal) : Bool {
    switch (getAppRole(user)) {
      case (?#Rider) { true };
      case (_) { false };
    };
  };

  func checkCustomerRoleAndPermissions(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    if (not isCustomer(caller)) {
      Runtime.trap("Unauthorized: Only customers can perform this action");
    };
  };

  func checkRiderRoleAndPermissions(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    if (not isRider(caller)) {
      Runtime.trap("Unauthorized: Only riders can perform this action");
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous users cannot have a profile") };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous users cannot have a profile") };

    let currentRole = AccessControl.getUserRole(accessControlState, caller);
    if (currentRole == #guest) {
      AccessControl.assignRole(accessControlState, caller, caller, #user);
    };

    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func assignAppRole(user : Principal, role : AppRole) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can assign roles");
    };
    let profile : UserProfile = switch (userProfiles.get(user)) {
      case (null) { { name = ""; appRole = ?role } };
      case (?existing) { { name = existing.name; appRole = ?role } };
    };
    userProfiles.add(user, profile);
  };

  public shared ({ caller }) func assignLocationToRider(locationId : Nat, riderId : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can assign locations");
    };
    if (not isRider(riderId)) { Runtime.trap("Target user must be a Rider") };
    switch (locations.get(locationId)) {
      case (null) { Runtime.trap("Location not found") };
      case (?_) {
        locationAssignments.add(locationId, riderId);
      };
    };
  };

  public shared ({ caller }) func saveLocation(
    locationLabel : Text,
    latitude : Float,
    longitude : Float,
    orientation : Text,
    landmarkNotes : Text,
    confidenceScore : Nat,
  ) : async Nat {
    checkCustomerRoleAndPermissions(caller);
    let location : Location = {
      id = nextLocationId;
      owner = caller;
      locationLabel;
      latitude;
      longitude;
      orientation;
      landmarkNotes;
      confidenceScore;
    };
    locations.add(nextLocationId, location);
    nextLocationId += 1;
    location.id;
  };

  public query ({ caller }) func listLocations() : async [Location] {
    checkCustomerRoleAndPermissions(caller);
    var result : [Location] = [];
    for ((id, location) in locations.entries()) {
      if (location.owner == caller) {
        result := result.concat([location]);
      };
    };
    result;
  };

  public shared ({ caller }) func updateLocation(
    locationId : Nat,
    locationLabel : Text,
    latitude : Float,
    longitude : Float,
    orientation : Text,
    landmarkNotes : Text,
    confidenceScore : Nat,
  ) : async () {
    checkCustomerRoleAndPermissions(caller);
    switch (locations.get(locationId)) {
      case (null) { Runtime.trap("Location not found") };
      case (?location) {
        if (location.owner != caller) {
          Runtime.trap("Unauthorized: You can only update your own locations");
        };
        let updatedLocation : Location = {
          id = locationId;
          owner = caller;
          locationLabel;
          latitude;
          longitude;
          orientation;
          landmarkNotes;
          confidenceScore;
        };
        locations.add(locationId, updatedLocation);
      };
    };
  };

  public shared ({ caller }) func deleteLocation(locationId : Nat) : async () {
    checkCustomerRoleAndPermissions(caller);
    switch (locations.get(locationId)) {
      case (null) { Runtime.trap("Location not found") };
      case (?location) {
        if (location.owner != caller) {
          Runtime.trap("Unauthorized: You can only delete your own locations");
        };
        locations.remove(locationId);
        locationAssignments.remove(locationId);
      };
    };
  };

  public query ({ caller }) func getLocation(locationId : Nat) : async Location {
    checkRiderRoleAndPermissions(caller);
    switch (locations.get(locationId)) {
      case (null) { Runtime.trap("Location not found") };
      case (?location) {
        switch (locationAssignments.get(locationId)) {
          case (null) { Runtime.trap("Location not assigned to you") };
          case (?assignedRider) {
            if (assignedRider != caller) { Runtime.trap("Location not assigned to you") };
            location;
          };
        };
      };
    };
  };

  public shared ({ caller }) func confirmPickup(locationId : Nat, status : Text) : async Nat {
    checkRiderRoleAndPermissions(caller);
    switch (locations.get(locationId)) {
      case (null) { Runtime.trap("Location not found") };
      case (?_) {
        switch (locationAssignments.get(locationId)) {
          case (null) { Runtime.trap("Location not assigned to you") };
          case (?assignedRider) {
            if (assignedRider != caller) { Runtime.trap("Location not assigned to you") };
          };
        };
      };
    };
    let verification : Verification = {
      id = nextVerificationId;
      locationId;
      rider = caller;
      timestamp = Time.now();
      status;
    };
    verifications.add(nextVerificationId, verification);
    nextVerificationId += 1;
    verification.id;
  };

  public query ({ caller }) func listVerifications() : async [Verification] {
    checkRiderRoleAndPermissions(caller);
    var result : [Verification] = [];
    for ((id, verification) in verifications.entries()) {
      if (verification.rider == caller) {
        result := result.concat([verification]);
      };
    };
    result;
  };

  public query ({ caller }) func getAllLocations() : async [Location] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all locations");
    };
    var result : [Location] = [];
    for ((id, location) in locations.entries()) {
      result := result.concat([location]);
    };
    result;
  };

  public query ({ caller }) func getAllVerifications() : async [Verification] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all verifications");
    };
    var result : [Verification] = [];
    for ((id, verification) in verifications.entries()) {
      result := result.concat([verification]);
    };
    result;
  };

  public query ({ caller }) func getLocationAssignments() : async [(Nat, Principal)] {
    let entries = locationAssignments.toArray();
    entries;
  };
};
