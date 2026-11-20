import { expect, test, type Page } from "@playwright/test";

const HOME = "/";

const PROFILE_NAME = "Carlos Fontán";
const PROJECTS = [
  {
    title: "ESP32-IIoT-Kit",
    status: "alpha",
    description:
      "Plataforma educativa de monitorización industrial con ESP32: nodos por ESP-NOW, gateway autónomo con dashboard embebido y MQTT/Sparkplug B opcionales.",
    repo: "https://github.com/fgjcarlos/ESP32-IIoT-Kit",
    demo: "https://fgjcarlos.github.io/ESP32-IIoT-Kit/",
  },
  {
    title: "LGB — Logix Gateway Bridge",
    status: "alpha",
    description:
      "Gateway open source bidireccional entre PLCs ControlLogix/CompactLogix (Rockwell) y OPC UA / MQTT Sparkplug B, dejando el control en el PLC.",
    repo: "https://github.com/fgjcarlos/lgb",
    demo: "https://fgjcarlos.github.io/lgb/",
  },
  {
    title: "MCM — Mosquitto Control Manager",
    status: "alpha",
    description:
      "Plano de control open source para Mosquitto: gestiona usuarios, ACLs, listeners y TLS con MFA y audit trail, sin reemplazar el broker.",
    repo: "https://github.com/fgjcarlos/mcm",
    demo: "https://fgjcarlos.github.io/mcm/",
  },
  {
    title: "NRCC — Node-RED 5 Control Center",
    status: "beta",
    description:
      "Plano de control visual para una instancia Node-RED 5: edita settings.js con diff, validación, backup y rollback transaccional.",
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

test.describe("Home: cine-scroll direction 05", () => {
  test("opens with a text-only hero: the name, no photo and no biography", async ({
    page,
  }) => {
    await openHome(page);

    await expect(page.locator("#sobre-mi h1")).toHaveText(PROFILE_NAME);
    await expect(page.locator("#sobre-mi img")).toHaveCount(0);
    await expect(page.locator(".bio-texto")).toHaveCount(0);
  });

  test("stacks the hero and every project as sticky full-screen panels on desktop", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openHome(page);

    const panels = page.locator("[data-fx-panel]");

    await expect(panels).toHaveCount(PROJECTS.length + 1);

    for (let index = 0; index < PROJECTS.length + 1; index++) {
      const style = await panels.nth(index).evaluate((element) => {
        const computed = getComputedStyle(element);

        return {
          position: computed.position,
          top: computed.top,
          height: element.getBoundingClientRect().height,
        };
      });

      expect(style.position, `panel ${index + 1} position`).toBe("sticky");
      expect(style.top, `panel ${index + 1} top`).toBe("0px");
      expect(style.height, `panel ${index + 1} height`).toBe(900);
    }
  });

  test("keeps a keyboard-focused project link uncovered by the stacked panels", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openHome(page);

    const link = page
      .locator("#proyectos article")
      .nth(2)
      .getByRole("link")
      .first();

    await link.focus();

    const uncovered = await link.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const hit = document.elementFromPoint(
        box.x + box.width / 2,
        box.y + box.height / 2,
      );

      return hit !== null && element.contains(hit);
    });

    expect(uncovered).toBe(true);
  });

  test("lets panels scroll normally on narrow screens", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHome(page);

    const position = await page
      .locator("[data-fx-panel]")
      .first()
      .evaluate((element) => getComputedStyle(element).position);

    expect(position).not.toBe("sticky");
  });

  test("links each project to its full case study first", async ({ page }) => {
    await openHome(page);

    const firstLink = page
      .locator("#proyectos article")
      .first()
      .getByRole("link")
      .first();

    await expect(firstLink).toHaveText(/ver caso completo/);
    await expect(firstLink).toHaveAttribute("href", /^\/projects\//);
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

      const repo = card.getByRole("link", { name: "código" });
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
