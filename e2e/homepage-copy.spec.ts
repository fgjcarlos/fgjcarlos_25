import { expect, test, type Page } from "@playwright/test";

const HOME = "/";

const PROFILE_NAME = "Carlos Fontán";
const PROFILE_TITLE =
  "Desarrollador Software IT/OT · IoT Industrial · Automatización";
const PHOTO_ALT = "Foto de Carlos Fontán";

/**
 * Biography copy as it must be rendered: one scannable opening paragraph
 * followed by two short supporting paragraphs. Every sentence keeps the facts
 * of the previous single-paragraph biography.
 */
const BIO_PARAGRAPHS = [
  "Soy Carlos Fontán, desarrollador software con base técnica en automatización industrial, robótica e integración IT/OT.",
  "Trabajo construyendo soluciones que conectan sistemas físicos con aplicaciones web: control industrial, IoT, datos en tiempo real, visión artificial, APIs, dashboards y despliegues con Docker en entornos de campo.",
  "Mi perfil combina experiencia industrial real con desarrollo fullstack moderno, para entender tanto la máquina, el proceso y los sensores como la arquitectura software que los conecta.",
];

/** Emphasised spans keep the exact wording and order of the previous copy. */
const BIO_EMPHASIS = [
  "desarrollador software con base técnica en automatización industrial, robótica e integración IT/OT",
  "control industrial, IoT, datos en tiempo real",
  "Docker",
];

const PROJECTS = [
  {
    title: "ESP32-IIoT-Kit",
    status: "alpha",
    description:
      "Proyecto educativo de monitorización en piscifactorías: nodos por ESP-NOW y dashboard embebido, con conectividad irregular y alimentación limitada.",
    repo: "https://github.com/fgjcarlos/ESP32-IIoT-Kit",
    demo: "https://fgjcarlos.github.io/ESP32-IIoT-Kit/",
  },
  {
    title: "LGB — Logix Gateway Bridge",
    status: "alpha",
    description:
      "Gateway open source que conecta PLCs Rockwell con OPC UA y MQTT Sparkplug B, dejando el control en el PLC.",
    repo: "https://github.com/fgjcarlos/lgb",
    demo: "https://fgjcarlos.github.io/lgb/",
  },
  {
    title: "MCM — Mosquitto Control Manager",
    status: "alpha",
    description:
      "Plano de control open source para Mosquitto: centraliza configuración, permisos y trazabilidad sin reemplazar el broker.",
    repo: "https://github.com/fgjcarlos/mcm",
    demo: "https://fgjcarlos.github.io/mcm/",
  },
  {
    title: "NRCC — Node-RED Control Center",
    status: "beta",
    description:
      "Plano de control local-first para Node-RED: centraliza configuración, backups y supervisión sin reemplazar el runtime.",
    repo: "https://github.com/fgjcarlos/nrcc",
    demo: "https://fgjcarlos.github.io/nrcc/",
  },
];

/**
 * Opens the home page in a deterministic state: reduced motion settles the
 * entry animations and the web font is ready before any text is measured.
 */
async function openHome(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(HOME);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
}

/** Collapses the whitespace the template introduces between segments. */
function normalize(value: string | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

test.describe("Home: biography readability", () => {
  test("splits the biography into an opening and two supporting paragraphs", async ({
    page,
  }) => {
    await openHome(page);

    const paragraphs = page.locator("#sobre-mi .bio-texto > p");

    await expect(paragraphs).toHaveCount(3);

    for (const [index, expected] of BIO_PARAGRAPHS.entries()) {
      const text = normalize(await paragraphs.nth(index).textContent());

      expect(text, `bio paragraph ${index + 1}`).toBe(expected);
    }
  });

  test("keeps the emphasised spans and the profile identity untouched", async ({
    page,
  }) => {
    await openHome(page);

    const emphasis = page.locator("#sobre-mi .bio-texto span.italic");

    await expect(emphasis).toHaveCount(BIO_EMPHASIS.length);

    for (const [index, expected] of BIO_EMPHASIS.entries()) {
      const text = normalize(await emphasis.nth(index).textContent());

      expect(text, `emphasis ${index + 1}`).toBe(expected);
    }

    await expect(page.locator("#sobre-mi h1")).toHaveText(PROFILE_NAME);
    await expect(page.locator("#sobre-mi > div > p")).toHaveText(PROFILE_TITLE);
    await expect(page.locator(`#sobre-mi img[alt="${PHOTO_ALT}"]`)).toHaveCount(
      1,
    );
  });
});

test.describe("Home: project summaries", () => {
  test("foregrounds the problem and the solution of every published project", async ({
    page,
  }) => {
    await openHome(page);

    const cards = page.locator("#proyectos article");

    await expect(cards).toHaveCount(PROJECTS.length);

    for (const project of PROJECTS) {
      const card = cards.filter({
        has: page.getByText(project.title, { exact: true }),
      });

      await expect(card, `card for ${project.title}`).toHaveCount(1);

      const description = card.locator("p");

      await expect(description, `description of ${project.title}`).toHaveCount(
        1,
      );

      const text = normalize(await description.textContent());

      expect(text, `description of ${project.title}`).toBe(project.description);
    }
  });

  test("keeps the project names, statuses and links unchanged", async ({
    page,
  }) => {
    await openHome(page);

    const cards = page.locator("#proyectos article");

    for (const project of PROJECTS) {
      const card = cards.filter({
        has: page.getByText(project.title, { exact: true }),
      });

      await expect(
        card.getByText(project.status, { exact: true }),
        `status of ${project.title}`,
      ).toHaveCount(1);

      const repo = card.getByRole("link", { name: "Repo" });
      const demo = card.getByRole("link", { name: "Demo" });

      await expect(repo, `repo link of ${project.title}`).toHaveAttribute(
        "href",
        project.repo,
      );
      await expect(demo, `demo link of ${project.title}`).toHaveAttribute(
        "href",
        project.demo,
      );
    }
  });
});
