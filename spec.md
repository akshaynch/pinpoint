# PinPoint

## Current State
- Users complete onboarding and are assigned a single role (Customer or Rider).
- App.tsx renders either `<CustomerView />` or `<RiderView />` based on the stored `profile.appRole`.
- AppNav shows the current role as a read-only badge in the user dropdown.
- No way to switch views without changing the stored profile role.

## Requested Changes (Diff)

### Add
- A role-switcher toggle/control in the AppNav (or prominently near the top of the main content) that lets the logged-in user flip between the Customer interface and the Rider interface without changing their stored profile role.
- A local `activeView` state (React state, not persisted to backend) that overrides which view is rendered.

### Modify
- `App.tsx`: introduce `activeView` state initialized to `profile.appRole`; pass a `setActiveView` callback down (or use a simple prop/context) so AppNav can trigger the switch.
- `AppNav.tsx`: replace the read-only role badge with an interactive toggle (e.g. a pill-style toggle or segmented control with "Customer" and "Rider" labels) that calls `setActiveView`. Highlight the currently active view.
- The main content area renders `<CustomerView />` or `<RiderView />` based on `activeView`, not `profile.appRole`.

### Remove
- Nothing removed.

## Implementation Plan
1. In `App.tsx`, add `useState<string>(role)` for `activeView`. Pass `activeView` and `setActiveView` to `AppNav`.
2. In `App.tsx` main content, replace `role === AppRole.Customer` / `role === AppRole.Rider` checks with `activeView === AppRole.Customer` / `activeView === AppRole.Rider`.
3. In `AppNav.tsx`, accept `activeView` and `onSwitchView` props. Replace the static role badge with a compact segmented toggle (Customer | Rider) that calls `onSwitchView` on click.
4. Style the active segment distinctly (filled/highlighted) and the inactive one muted.
5. Typecheck and build to verify no errors.
