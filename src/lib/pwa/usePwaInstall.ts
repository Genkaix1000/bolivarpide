"use client";

import { useCallback, useEffect, useState } from "react";
import type { BeforeInstallPromptEvent } from "@/lib/pwa/install-global";
import {
  BP_INSTALL_VALUE,
  readInstallCookieClient,
  setInstallCookie,
} from "@/lib/pwa/install-global";

function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  );
}

function isChromiumInstallable() {
  return /(Chrome|CriOS|Edg\/|OPR|SamsungBrowser|Android)/.test(navigator.userAgent);
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export type RequestInstallResult = "installed" | "dismissed" | "ios" | "pending";

/**
 * Fuente de verdad compartida para la instalación PWA (FAB + menús).
 * Los flags se detectan tras el mount (evita mismatch de hidratación).
 */
export function usePwaInstall() {
  const [isCapable, setIsCapable] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setIsIos(isIOS());
      setIsCapable(isIOS() || isChromiumInstallable());
      setInstalled(readInstallCookieClient() === BP_INSTALL_VALUE || isStandalone());
      setDismissed(readInstallCookieClient() === "dismissed");
      setDeferred(window.__bpDeferredPrompt ?? null);
    });

    const onBeforeInstallPrompt = (event: Event) => {
      const bip = event as BeforeInstallPromptEvent;
      setDeferred(bip);
      window.__bpDeferredPrompt = bip;
    };
    const onAppInstalled = () => {
      setInstallCookie(BP_INSTALL_VALUE);
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const requestInstall = useCallback(async (): Promise<RequestInstallResult> => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null);
      window.__bpDeferredPrompt = null;
      if (choice.outcome === "accepted") {
        setInstallCookie(BP_INSTALL_VALUE);
        setInstalled(true);
        return "installed";
      }
      return "dismissed";
    }
    return isIos ? "ios" : "pending";
  }, [deferred, isIos]);

  return { isCapable, isIos, installed, dismissed, deferred, requestInstall };
}