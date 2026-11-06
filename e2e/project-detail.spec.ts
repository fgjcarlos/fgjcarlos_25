import { expect, test, type Page } from "@playwright/test";

/**
 * Project detail pages (src/pages/projects/[slug].astro) render an MDX body
 * through the typography plugin. Two defects are covered here:
 *
 * 1. The "Stack" section is authored as a GFM table. Without GFM in the MDX
 *    pipeline the table is emitted as raw pipe text inside a paragraph.
 * 2. The CLI block paints a code chip over the code block surface, so the
 *    block is unreadable.
 *
 * Everything is asserted through public UI and computed styles: no class
 * names are used as a proxy for a visual result.
 */

const PROJECTS = [
  { slug: "mcm", hasCli: true },
  { slug: "lgb", hasCli: true },
  { slug: "nrcc", hasCli: true },
  { slug: "esp32-iiot-kit", hasCli: false },
] as const;

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 1000 };

type Rgb = { r: number; g: number; b: number; a: number };
type StyleSnapshot = {
  backgroundColor: string;
  color: string;
  borderTopWidth: string;
  borderTopColor: string;
  borderBottomWidth: string;
  borderBottomColor: string;
  paddingTop: string;
  paddingLeft: string;
  fontFamily: string;
};

type ProjectSnapshot = {
  tokens: { base200: string; base300: string; baseContent: string };
  pre: StyleSnapshot | null;
  preCode: StyleSnapshot | null;
  inlineCode: StyleSnapshot | null;
  table: StyleSnapshot | null;
  tableHeadCell: StyleSnapshot | null;
  tableBodyCell: StyleSnapshot | null;
  tableCount: number;
  headerTexts: string[];
  rowCount: number;
  pipeParagraphs: number;
  proseHasPipeRow: boolean;
  docScrollWidth: number;
  innerWidth: number;
};

/**
 * Opens a project page in a deterministic state: reduced motion settles the
 * entry animations and the web font is ready before any colour is measured.
 */
async function openProject(page: Page, slug: string): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/projects/${slug}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
}

/**
 * Reads the rendered state of the article: computed styles of the CLI block,
 * the inline code chip and the Stack table, plus the resolved theme tokens.
 */
async function readProject(page: Page): Promise<ProjectSnapshot> {
  return page.evaluate(() => {
    const prose = document.querySelector(".prose");
    const pre = prose?.querySelector("pre") ?? null;
    const table = prose?.querySelector("table") ?? null;

    const snapshot = (element: Element | null): StyleSnapshot | null => {
      if (!element) return null;
      const computed = getComputedStyle(element);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        borderTopWidth: computed.borderTopWidth,
        borderTopColor: computed.borderTopColor,
        borderBottomWidth: computed.borderBottomWidth,
        borderBottomColor: computed.borderBottomColor,
        paddingTop: computed.paddingTop,
        paddingLeft: computed.paddingLeft,
        fontFamily: computed.fontFamily,
      };
    };

    const token = (name: string): string => {
      const probe = document.createElement("div");
      probe.style.backgroundColor = `var(${name})`;
      document.body.appendChild(probe);
      const value = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return value;
    };

    const paragraphs = Array.from(prose?.querySelectorAll("p") ?? []);
    const proseText = prose?.textContent ?? "";

    return {
      tokens: {
        base200: token("--color-base-200"),
        base300: token("--color-base-300"),
        baseContent: token("--color-base-content"),
      },
      pre: snapshot(pre),
      preCode: snapshot(pre?.querySelector("code") ?? null),
      inlineCode: snapshot(prose?.querySelector("p code") ?? null),
      table: snapshot(table),
      tableHeadCell: snapshot(table?.querySelector("thead th") ?? null),
      tableBodyCell: snapshot(table?.querySelector("tbody td") ?? null),
      tableCount: prose?.querySelectorAll("table").length ?? 0,
      headerTexts: Array.from(table?.querySelectorAll("thead th") ?? []).map(
        (cell) => cell.textContent?.trim() ?? "",
      ),
      rowCount: table?.querySelectorAll("tbody tr").length ?? 0,
      pipeParagraphs: paragraphs.filter((paragraph) =>
        (paragraph.textContent ?? "").includes("|"),
      ).length,
      proseHasPipeRow: proseText.includes("| Capa"),
      docScrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    };
  });
}

/**
 * Resolves any CSS colour (oklch, rgb, rgba, …) to sRGB bytes with the
 * browser's own colour engine, so the theme tokens and the computed styles
 * are compared in the same space.
 */
async function resolveColors(page: Page, colors: string[]): Promise<Rgb[]> {
  return page.evaluate((values) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d");

    if (!context) throw new Error("2d canvas context is not available");

    return values.map((value) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = "#000000";
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
      return { r, g, b, a: alphaOf(value) };
    });

    function alphaOf(color: string): number {
      const value = color.trim().toLowerCase();

      if (value === "transparent") return 0;

      const rgba = value.match(/^rgba?\(([^)]+)\)$/);
      if (rgba) {
        const parts = rgba[1].split(/[\s,/]+/).filter(Boolean);
        return parts.length >= 4 ? Number(parts[3]) : 1;
      }

      const slash = value.match(/\/\s*([0-9.]+)\s*$/);
      if (slash) return Number(slash[1]);

      return 1;
    }
  }, colors);
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number): number => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(foreground: Rgb, background: Rgb): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

function sameColor(a: Rgb, b: Rgb): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b;
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

test.describe("Project detail: Stack table", () => {
  test.use({ viewport: DESKTOP });

  for (const { slug } of PROJECTS) {
    test(`renders the Stack section of /projects/${slug} as a real table`, async ({
      page,
    }) => {
      await openProject(page, slug);

      const snapshot = await readProject(page);

      expect(snapshot.tableCount).toBe(1);
      expect(snapshot.rowCount).toBeGreaterThan(0);
      expect(snapshot.headerTexts.map(normalize)).toEqual([
        "capa",
        "tecnologia",
      ]);

      // The pipe row must not survive as raw text anywhere in the article.
      expect(snapshot.pipeParagraphs).toBe(0);
      expect(snapshot.proseHasPipeRow).toBe(false);
    });
  }
});

test.describe("Project detail: Stack table surfaces", () => {
  test.use({ viewport: DESKTOP });

  for (const { slug } of PROJECTS) {
    test(`styles the table of /projects/${slug} like the rest of the system`, async ({
      page,
    }) => {
      await openProject(page, slug);

      const snapshot = await readProject(page);
      expect(snapshot.table).not.toBeNull();
      expect(snapshot.tableHeadCell).not.toBeNull();
      expect(snapshot.tableBodyCell).not.toBeNull();

      const [base200, base300, baseContent] = await resolveColors(page, [
        snapshot.tokens.base200,
        snapshot.tokens.base300,
        snapshot.tokens.baseContent,
      ]);

      const head = snapshot.tableHeadCell!;
      const body = snapshot.tableBodyCell!;

      const headBackground = await resolveColors(page, [head.backgroundColor]);
      expect(sameColor(headBackground[0], base200)).toBe(true);

      const headText = await resolveColors(page, [head.color]);
      expect(sameColor(headText[0], baseContent)).toBe(true);

      // 1px separators between rows, on the paper family.
      expect(body.borderBottomWidth).toBe("1px");
      const separator = await resolveColors(page, [body.borderBottomColor]);
      expect(
        sameColor(separator[0], base200) || sameColor(separator[0], base300),
      ).toBe(true);

      // Comfortable cell padding.
      expect(parseFloat(body.paddingTop)).toBeGreaterThanOrEqual(4);
      expect(parseFloat(body.paddingLeft)).toBeGreaterThanOrEqual(4);

      // The single monospace family is inherited.
      expect(body.fontFamily).toContain("LXGW WenKai Mono TC");
    });
  }
});

test.describe("Project detail: CLI code block", () => {
  test.use({ viewport: DESKTOP });

  for (const { slug, hasCli } of PROJECTS) {
    test(`keeps the CLI block of /projects/${slug} legible on paper`, async ({
      page,
    }) => {
      await openProject(page, slug);

      const snapshot = await readProject(page);

      if (!hasCli) {
        expect(snapshot.pre).toBeNull();
        return;
      }

      expect(snapshot.pre).not.toBeNull();
      expect(snapshot.preCode).not.toBeNull();

      const [base200, base300, baseContent] = await resolveColors(page, [
        snapshot.tokens.base200,
        snapshot.tokens.base300,
        snapshot.tokens.baseContent,
      ]);

      const pre = snapshot.pre!;
      const code = snapshot.preCode!;

      // The block surface is the paper token, not a dark surface.
      const preBackground = await resolveColors(page, [pre.backgroundColor]);
      expect(sameColor(preBackground[0], base200)).toBe(true);

      // The block keeps a 1px border on the paper family.
      expect(pre.borderTopWidth).toBe("1px");
      const border = await resolveColors(page, [pre.borderTopColor]);
      expect(sameColor(border[0], base300)).toBe(true);

      // The code element inside the block is transparent, not a light chip.
      const codeBackground = await resolveColors(page, [code.backgroundColor]);
      expect(codeBackground[0].a).toBe(0);

      // The code inherits the block foreground.
      const [preText, codeText] = await resolveColors(page, [
        pre.color,
        code.color,
      ]);
      expect(sameColor(codeText, preText)).toBe(true);
      expect(sameColor(preText, baseContent)).toBe(true);

      // WCAG 2 AA for body text on the resolved surfaces.
      expect(contrastRatio(preText, preBackground[0])).toBeGreaterThanOrEqual(
        4.5,
      );
    });
  }
});

test.describe("Project detail: inline code chip", () => {
  test.use({ viewport: DESKTOP });

  for (const { slug } of PROJECTS) {
    test(`keeps the inline code chip of /projects/${slug} legible`, async ({
      page,
    }) => {
      await openProject(page, slug);

      const snapshot = await readProject(page);
      expect(snapshot.inlineCode).not.toBeNull();

      const inline = snapshot.inlineCode!;

      const [base200, baseContent] = await resolveColors(page, [
        snapshot.tokens.base200,
        snapshot.tokens.baseContent,
      ]);

      const [chipBackground, chipText] = await resolveColors(page, [
        inline.backgroundColor,
        inline.color,
      ]);

      // The chip keeps its paper surface (it is not made transparent).
      expect(chipBackground.a).toBeGreaterThan(0);
      expect(sameColor(chipBackground, base200)).toBe(true);

      // Ink text on the chip.
      expect(sameColor(chipText, baseContent)).toBe(true);
      expect(contrastRatio(chipText, chipBackground)).toBeGreaterThanOrEqual(
        4.5,
      );
    });
  }
});

test.describe("Project detail: narrow viewport", () => {
  test.use({ viewport: MOBILE });

  for (const { slug } of PROJECTS) {
    test(`does not overflow the document on /projects/${slug}`, async ({
      page,
    }) => {
      await openProject(page, slug);

      const snapshot = await readProject(page);

      expect(snapshot.tableCount).toBe(1);
      expect(snapshot.docScrollWidth).toBeLessThanOrEqual(snapshot.innerWidth);
    });
  }
});
