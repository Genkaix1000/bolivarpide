/** Exported for check — canvas can't paint these CSS color functions. */
export const UNSUPPORTED_CAPTURE_COLOR = /oklch|oklab|lab\(|lch\(|color\(display-p3/i;

const COLOR_PROPS = [
  "color",
  "background-color",
  "border-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "outline-color",
  "text-decoration-color",
  "fill",
  "stroke",
] as const;

type StyleBackup = {
  el: HTMLElement;
  prop: string;
  value: string;
  priority: string;
};

function cssToCanvasColor(color: string): string {
  if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)") return color;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "#292524";
  ctx.fillStyle = "#000000";
  ctx.fillStyle = color;
  const out = ctx.fillStyle;
  if (UNSUPPORTED_CAPTURE_COLOR.test(out)) return "#292524";
  return out;
}

/** html-to-image + Tailwind oklch/lab rompe el canvas; inlinamos colores seguros. */
function withCaptureSafeStyles<T>(el: HTMLElement, run: () => Promise<T>): Promise<T> {
  const backups: StyleBackup[] = [];
  const nodes = [el, ...el.querySelectorAll<HTMLElement>("*")];

  for (const node of nodes) {
    const cs = getComputedStyle(node);
    for (const prop of COLOR_PROPS) {
      const raw = cs.getPropertyValue(prop);
      if (!raw || !UNSUPPORTED_CAPTURE_COLOR.test(raw)) continue;
      backups.push({
        el: node,
        prop,
        value: node.style.getPropertyValue(prop),
        priority: node.style.getPropertyPriority(prop),
      });
      node.style.setProperty(prop, cssToCanvasColor(raw), "important");
    }
    if (node.classList.contains("material-symbols-outlined")) {
      backups.push({
        el: node,
        prop: "visibility",
        value: node.style.getPropertyValue("visibility"),
        priority: node.style.getPropertyPriority("visibility"),
      });
      node.style.setProperty("visibility", "hidden", "important");
    }
  }

  return run().finally(() => {
    for (const b of backups) {
      if (b.value) b.el.style.setProperty(b.prop, b.value, b.priority);
      else b.el.style.removeProperty(b.prop);
    }
  });
}

function canShareFiles(file: File) {
  try {
    return Boolean(typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] }));
  } catch {
    return false;
  }
}

/** Captura un nodo DOM como JPEG y lo comparte o descarga. */
export async function shareComandaJpeg(
  el: HTMLElement,
  orderNumber: number,
): Promise<"shared" | "downloaded" | "cancelled"> {
  const { toJpeg } = await import("html-to-image");

  const dataUrl = await withCaptureSafeStyles(el, () =>
    toJpeg(el, {
      quality: 0.92,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      cacheBust: true,
      // ponytail: Material Symbols embed falls over; icons hidden during capture
      skipFonts: true,
    }),
  );

  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], `comanda-${orderNumber}.jpg`, { type: "image/jpeg" });

  if (canShareFiles(file)) {
    try {
      await navigator.share({ files: [file], title: `Comanda #${orderNumber}` });
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return "cancelled";
      throw err;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
  return "downloaded";
}
