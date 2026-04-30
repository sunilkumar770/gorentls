"use client";

import { useEffect, useMemo, useState } from "react";

export type MapsStatus = "disabled" | "loading" | "ready" | "error";

const SCRIPT_ID = "gorentals-maps-script";

function isMapsLoaded(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.google !== "undefined" &&
    typeof window.google.maps !== "undefined"
  );
}

export function useGoogleMaps() {
  const apiKey = useMemo(
    () => (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").trim(),
    []
  );

  const [status, setStatus] = useState<MapsStatus>(() => {
    if (typeof window === "undefined") return "loading";
    if (!apiKey) return "disabled";
    if (isMapsLoaded()) return "ready";
    return "loading";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Fix: explicitly set disabled in effect — covers SSR hydration edge case
    if (!apiKey) {
      setStatus("disabled");
      return;
    }

    if (isMapsLoaded()) {
      setStatus("ready");
      return;
    }

    // React StrictMode runs effects twice — SCRIPT_ID prevents double injection
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load",  () => setStatus(isMapsLoaded() ? "ready" : "error"), { once: true });
      existing.addEventListener("error", () => setStatus("error"), { once: true });
      return;
    }

    const script   = document.createElement("script");
    script.id      = SCRIPT_ID;
    script.src     = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async   = true;
    script.defer   = true;
    script.onload  = () => setStatus(isMapsLoaded() ? "ready" : "error");
    script.onerror = () => {
      setStatus("error");
    };
    document.head.appendChild(script);
  }, [apiKey]);

  return {
    status,
    isDisabled: status === "disabled",
    isLoading:  status === "loading",
    isReady:    status === "ready",
    isError:    status === "error",
  };
}
