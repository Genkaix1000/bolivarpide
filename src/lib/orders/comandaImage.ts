/** Captura un nodo DOM como JPEG y lo comparte o descarga. */
export async function shareComandaJpeg(
  el: HTMLElement,
  orderNumber: number,
): Promise<"shared" | "downloaded"> {
  const { toJpeg } = await import("html-to-image");
  const dataUrl = await toJpeg(el, {
    quality: 0.92,
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
  });
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], `comanda-${orderNumber}.jpg`, { type: "image/jpeg" });

  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: `Comanda #${orderNumber}` });
    return "shared";
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
  return "downloaded";
}
