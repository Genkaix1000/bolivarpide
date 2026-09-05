"use client";

import { ConfirmActionRail, type ConfirmActionRailProps } from "./ConfirmActionRail";

export type LogoutNavRailProps = ConfirmActionRailProps;

/**
 * Acción con confirmación inline: ícono → ✕ y ✓ al confirmar.
 * Delega en ConfirmActionRail con defaults de logout.
 */
export function LogoutNavRail({
  askIcon = "logout",
  askTitle = "Cerrar sesión",
  ...props
}: LogoutNavRailProps) {
  return <ConfirmActionRail askIcon={askIcon} askLabel={askTitle} askTitle={askTitle} {...props} />;
}

