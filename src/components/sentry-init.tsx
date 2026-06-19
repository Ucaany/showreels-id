"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/** Loads Sentry on the client when DSN is configured (layout-safe). */
export function SentryInit() {
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;
    const rate = Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.05);
    Sentry.init({
      dsn,
      tracesSampleRate: Number.isFinite(rate) ? rate : 0.05,
      environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    });
  }, []);

  return null;
}
