// Leaflet is loaded dynamically via CDN script tag; no installed package needed.
// Using loose Record type since @types/leaflet is not in package.json
type LeafletLib = any; // Leaflet CDN global; no @types/leaflet installed

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

interface LocationMapProps {
  latitude: number;
  longitude: number;
  draggable?: boolean;
  onPositionChange?: (lat: number, lng: number, zoom: number) => void;
  zoom?: number;
}

export interface LocationMapHandle {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
  setZoom: (zoom: number) => void;
}

/** Injects the Leaflet CSS + JS from CDN once, returns when ready. */
function loadLeaflet(): Promise<LeafletLib> {
  const win = window as LeafletLib;
  if (win.L) return Promise.resolve(win.L);

  return new Promise((resolve, reject) => {
    // CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // JS
    if (!document.querySelector('script[src*="leaflet"]')) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => resolve(win.L);
      script.onerror = () => reject(new Error("Failed to load Leaflet"));
      document.head.appendChild(script);
    } else {
      // Script tag exists but may still be loading — poll
      const interval = setInterval(() => {
        if (win.L) {
          clearInterval(interval);
          resolve(win.L);
        }
      }, 50);
    }
  });
}

export const LocationMap = forwardRef<LocationMapHandle, LocationMapProps>(
  function LocationMap(
    { latitude, longitude, draggable = false, onPositionChange, zoom = 13 },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<LeafletLib | null>(null);
    const markerRef = useRef<LeafletLib | null>(null);

    // Expose imperative handle for external control (e.g., fly to search result)
    useImperativeHandle(ref, () => ({
      flyTo(lat: number, lng: number, targetZoom?: number) {
        if (mapRef.current && markerRef.current) {
          const z = targetZoom ?? mapRef.current.getZoom();
          mapRef.current.flyTo([lat, lng], z, { duration: 1.2 });
          markerRef.current.setLatLng([lat, lng]);
        }
      },
      setZoom(z: number) {
        if (mapRef.current) {
          mapRef.current.setZoom(z);
        }
      },
    }));

    // biome-ignore lint/correctness/useExhaustiveDependencies: map initializes once on mount
    useEffect(() => {
      if (!containerRef.current) return;

      let isMounted = true;

      const initMap = async () => {
        const L = await loadLeaflet();

        if (!isMounted || !containerRef.current) return;
        if (mapRef.current) return;

        const map = L.map(containerRef.current, {
          center: [latitude, longitude],
          zoom,
          zoomControl: true,
          attributionControl: true,
        });

        // Use OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        // Custom pin icon using SVG
        const pinIcon = L.divIcon({
          html: `
            <div style="
              width: 32px;
              height: 32px;
              position: relative;
              filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
            ">
              <svg viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C9.373 0 4 5.373 4 12c0 9 12 28 12 28S28 21 28 12C28 5.373 22.627 0 16 0z" fill="oklch(0.78 0.14 195)" />
                <circle cx="16" cy="12" r="5" fill="oklch(0.13 0.02 255)" />
                <circle cx="16" cy="12" r="2.5" fill="oklch(0.78 0.14 195)" />
              </svg>
            </div>
          `,
          className: "",
          iconSize: [32, 40],
          iconAnchor: [16, 40],
          popupAnchor: [0, -40],
        });

        const marker = L.marker([latitude, longitude], {
          icon: pinIcon,
          draggable,
        }).addTo(map);

        markerRef.current = marker;
        mapRef.current = map;

        if (draggable) {
          marker.on("dragend", () => {
            const pos = marker.getLatLng();
            const currentZoom = map.getZoom();
            onPositionChange?.(pos.lat, pos.lng, currentZoom);
          });

          map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
            marker.setLatLng(e.latlng);
            const currentZoom = map.getZoom();
            onPositionChange?.(e.latlng.lat, e.latlng.lng, currentZoom);
          });

          map.on("zoomend", () => {
            const pos = marker.getLatLng();
            const currentZoom = map.getZoom();
            onPositionChange?.(pos.lat, pos.lng, currentZoom);
          });
        }
      };

      initMap();

      return () => {
        isMounted = false;
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
          markerRef.current = null;
        }
      };
    }, []);

    // Update marker position when lat/lng changes externally (for non-draggable view)
    useEffect(() => {
      if (mapRef.current && markerRef.current && !draggable) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapRef.current.setView([latitude, longitude], zoom);
      }
    }, [latitude, longitude, zoom, draggable]);

    return (
      <div
        ref={containerRef}
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ minHeight: "300px" }}
      />
    );
  },
);
