/**
 * Server-safe read of the GA4 Measurement ID - deliberately NOT re-exported
 * from gtag.ts (which is 'use client'). Confirmed via testing: a Server
 * Component (layout.tsx) importing a plain value from a 'use client' module
 * doesn't get the actual string - React treats it as an opaque client
 * reference and layout.tsx's inline script ended up with a garbled
 * "Attempted to call GA_MEASUREMENT_ID() from the server" placeholder
 * instead of the real ID. Keeping this in its own plain module (no 'use
 * client') is what lets layout.tsx use the real value server-side.
 */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
