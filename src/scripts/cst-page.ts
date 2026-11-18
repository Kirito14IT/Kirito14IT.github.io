import type { figures } from "../data/cst";

const viewer = document.querySelector<HTMLDialogElement>("[data-figure-dialog]");
if (viewer) {
  const figuresById: typeof figures = JSON.parse(viewer.dataset.figures!);
  const image = viewer.querySelector<HTMLImageElement>("[data-enlarged-figure]")!;
  const caption = viewer.querySelector<HTMLElement>("#enlarged-caption")!;
  const link = viewer.querySelector<HTMLAnchorElement>("[data-open-original]")!;
  const close = viewer.querySelector<HTMLButtonElement>("[data-close-figure]")!;
  const triggers = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-open-figure]"));
  let opener: HTMLButtonElement | undefined;

  triggers.forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.openFigure as keyof typeof figures;
      const figure = figuresById[id];
      opener = button.closest("[data-gallery-copy]")
        ? triggers.find((trigger) => trigger.dataset.openFigure === id && !trigger.closest("[data-gallery-copy]"))
        : button;
      const source = "/CST/assets/" + id + ".webp";
      image.src = source;
      image.alt = figure.name;
      caption.textContent = "Figure " + figure.number + " · " + figure.name;
      link.href = source;
      viewer.showModal();
      close.focus();
    });
  });
  close.addEventListener("click", () => viewer.close());
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) viewer.close();
  });
  viewer.addEventListener("close", () => opener?.focus());
}

const copy = document.querySelector<HTMLButtonElement>("[data-copy-bib]");
if (copy) {
  const code = document.querySelector<HTMLElement>("#citation-text")!;
  const status = document.querySelector<HTMLElement>("[data-copy-status]")!;
  let reset: number | undefined;
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(code.textContent ?? "");
      copy.textContent = "Copied";
      status.textContent = "BibTeX copied to clipboard.";
    } catch {
      const range = document.createRange();
      range.selectNodeContents(code);
      const selectedText = getSelection();
      selectedText?.removeAllRanges();
      selectedText?.addRange(range);
      copy.textContent = "Text selected";
      status.textContent = "BibTeX text selected for manual copying.";
    }
    window.clearTimeout(reset);
    reset = window.setTimeout(() => { copy.textContent = "Copy BibTeX"; }, 2200);
  });
}
