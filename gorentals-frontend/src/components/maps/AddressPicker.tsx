"use client";

import { useEffect, useRef } from "react";
import { MapPin, AlertTriangle, Loader2 } from "lucide-react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";

export type AddressUpdate = {
  location?: string;
  city?: string;
  state?: string;
};

type Props = {
  location: string;
  city: string;
  state: string;
  onAddressChange: (updates: AddressUpdate) => void;
};

const INPUT =
  "w-full px-4 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl " +
  "focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 " +
  "focus:border-[#16a34a] transition-all text-[#111827]";

export default function AddressPicker({ location, city, state, onAddressChange }: Props) {
  const { isReady, isLoading, isDisabled, isError } = useGoogleMaps();
  const acInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!acInputRef.current) return;
    if (!window.google?.maps?.places?.Autocomplete) return;

    const ac = new window.google.maps.places.Autocomplete(acInputRef.current, {
      fields: ["formatted_address", "address_components"],
      componentRestrictions: { country: "in" },
    });

    const listener = ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place.address_components) return;

      let pickedCity  = "";
      let pickedState = "";

      for (const comp of place.address_components) {
        if (comp.types.includes("locality"))
          pickedCity = comp.long_name;
        if (comp.types.includes("administrative_area_level_2") && !pickedCity)
          pickedCity = comp.long_name;
        if (comp.types.includes("administrative_area_level_1"))
          pickedState = comp.long_name;
      }

      onAddressChange({
        location: place.formatted_address ?? "",
        city:     pickedCity,
        state:    pickedState,
      });
    });

    return () => window.google.maps.event.removeListener(listener);
  }, [isReady, onAddressChange]);

  return (
    <div className="space-y-5">

      {/* Google autocomplete — only renders when maps is confirmed ready */}
      {isReady && (
        <div>
          <label className="block text-sm font-semibold text-[#374151] mb-1.5">
            Search address
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#16a34a]" />
            <input
              ref={acInputRef}
              type="text"
              placeholder="Start typing to search via Google Maps…"
              className="w-full pl-10 pr-4 py-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] transition-all text-[#111827]"
            />
          </div>
          <p className="text-xs text-[#6b7280] mt-1.5">
            Selecting a suggestion auto-fills the fields below.
          </p>
        </div>
      )}

      {/* Loading spinner */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-[#6b7280] bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-4 py-3">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading address autocomplete…
        </div>
      )}

      {/* Disabled / error banner */}
      {(isDisabled || isError) && (
        <div className="flex items-start gap-3 text-sm text-[#92400e] bg-[#fffbeb] border border-[#fde68a] rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[#d97706]" />
          <span>
            {isDisabled
              ? "Google Maps autocomplete is unavailable. Enter the address manually."
              : "Google Maps failed to load. Enter the address manually."}
          </span>
        </div>
      )}

      {/* Manual fields — ALWAYS rendered unconditionally */}
      <div>
        <label className="block text-sm font-semibold text-[#374151] mb-1.5">
          Locality / Neighbourhood *
        </label>
        <input
          type="text"
          required
          value={location}
          onChange={(e) => onAddressChange({ location: e.target.value })}
          placeholder="e.g. Indiranagar"
          className={INPUT}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-semibold text-[#374151] mb-1.5">City *</label>
          <input
            type="text"
            required
            value={city}
            onChange={(e) => onAddressChange({ city: e.target.value })}
            placeholder="e.g. Hyderabad"
            className={INPUT}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#374151] mb-1.5">State *</label>
          <input
            type="text"
            required
            value={state}
            onChange={(e) => onAddressChange({ state: e.target.value })}
            placeholder="e.g. Telangana"
            className={INPUT}
          />
        </div>
      </div>
    </div>
  );
}
