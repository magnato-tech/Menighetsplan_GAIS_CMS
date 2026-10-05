/**
 * Captures tight help article screenshots into public/help/.
 * Run: node scripts/capture-help-screenshots.mjs
 */
import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "help");

async function clearFrames() {
  await mkdir(OUT_DIR, { recursive: true });
  const names = await readdir(OUT_DIR);
  await Promise.all(
    names.filter((name) => name.endsWith(".png")).map((name) => unlink(path.join(OUT_DIR, name)))
  );
}

async function setupPage(browser) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  await context.addInitScript(() => {
    localStorage.setItem("menighetsplan_studio_content", "light");
    localStorage.setItem("menighetsplan_studio_sidebar", "dark");
  });
  const page = await context.newPage();
  return { context, page };
}

async function gotoTab(page, tab) {
  await page.goto(`${BASE}/admin?tab=${tab}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1200);
}

async function shotLocator(locator, filename) {
  await locator.waitFor({ state: "visible", timeout: 30000 });
  await locator.scrollIntoViewIfNeeded();
  const buffer = await locator.screenshot({ animations: "disabled" });
  await writeFile(path.join(OUT_DIR, filename), buffer);
  console.log(`✓ ${filename}`);
}

async function shotClip(page, clip, filename) {
  const buffer = await page.screenshot({ animations: "disabled", clip });
  await writeFile(path.join(OUT_DIR, filename), buffer);
  console.log(`✓ ${filename}`);
}

async function openPageEditor(page) {
  await gotoTab(page, "cms-sider");
  await page.waitForSelector("text=Sider & Innhold på nettsiden", { timeout: 30000 });
  const editButton = page.locator('button[title="Rediger side"]').first();
  if (await editButton.count()) {
    await editButton.click();
  } else {
    await page.locator('button:has-text("Rediger")').first().click();
  }
  await page.waitForSelector("text=Sidetittel (Vises i meny og header)", { timeout: 30000 });
  await page.waitForTimeout(400);
}

async function captureSider(page) {
  await gotoTab(page, "cms-sider");
  await page.waitForSelector("text=Hovedmeny (Offentlig nettsted)", { timeout: 30000 });
  const treePanel = page
    .locator("text=Hovedmeny (Offentlig nettsted)")
    .locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]");
  await shotLocator(treePanel, "hjelp-sider-sidetre.png");

  await openPageEditor(page);
  const settings = page
    .locator('label:has-text("Sidetittel (Vises i meny og header)")')
    .locator("xpath=ancestor::div[contains(@class,'grid')][1]");
  await shotLocator(settings, "hjelp-sider-innstillinger.png");

  const hero = page.locator('text=Hero / Toppbanner').locator("xpath=ancestor::div[@data-cms-editor-target][1]");
  await shotLocator(hero, "hjelp-sider-hero.png");

  const blocks = page
    .locator("text=Innholdsblokker & Moduler")
    .locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]");
  await shotLocator(blocks, "hjelp-sider-innhold.png");

  const publish = page
    .locator("text=Publisering & Synlighet")
    .locator("xpath=ancestor::div[contains(@class,'rounded-xl')][1]");
  await shotLocator(publish, "hjelp-sider-publisering.png");

  const seoToggle = page.locator('button:has-text("Søkemotoroptimalisering (SEO)")');
  if (await seoToggle.isVisible()) {
    await seoToggle.click();
    await page.waitForTimeout(300);
  }
  const seo = page
    .locator("text=Søkemotoroptimalisering (SEO)")
    .locator("xpath=ancestor::div[contains(@class,'rounded-xl')][1]");
  await shotLocator(seo, "hjelp-sider-sok.png");
}

async function main() {
  await clearFrames();
  const browser = await chromium.launch({ headless: true });
  const { context, page } = await setupPage(browser);

  try {
    await captureSider(page);

    await gotoTab(page, "cms-nyheter");
    await page.waitForSelector("text=Aktuelt", { timeout: 30000 });
    await page.locator('button:has-text("Ny artikkel")').click();
    await page.waitForSelector("text=Skriv ny artikkel", { timeout: 15000 });
    const newsForm = page.locator("text=Skriv ny artikkel").locator("xpath=ancestor::form[1]");
    await shotLocator(newsForm, "hjelp-nyheter.png");

    await gotoTab(page, "cms-taler");
    await page.waitForSelector("text=Taler & Prekenarkiv", { timeout: 30000 });
    await page.locator('button:has-text("Legg til tale")').click();
    await page.waitForSelector("text=Legg til ny tale", { timeout: 15000 });
    const sermonForm = page.locator("text=Legg til ny tale").locator("xpath=ancestor::form[1]");
    await shotLocator(sermonForm, "hjelp-taler.png");

    await gotoTab(page, "cms-stab");
    await page.waitForSelector("text=Lederskap & Stab", { timeout: 30000 });
    const staffHeader = page.locator('h2:has-text("Lederskap & Stab")').locator("xpath=ancestor::div[contains(@class,'border-b')][1]");
    await shotLocator(staffHeader, "hjelp-lederskap.png");

    await gotoTab(page, "cms-medier");
    await page.waitForSelector("text=Last opp nytt bilde", { timeout: 30000 });
    const mediaUpload = page.locator('text=Last opp nytt bilde').locator("xpath=ancestor::div[contains(@class,'rounded-xl')][1]");
    await shotLocator(mediaUpload, "hjelp-mediebibliotek.png");

    await gotoTab(page, "cms-overstyringer");
    await page.waitForSelector("text=Forside-overstyring for arrangementer", { timeout: 30000 });
    const firstVisibilityCard = page
      .locator('button:has-text("Fremhev")')
      .first()
      .locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]");
    await shotLocator(firstVisibilityCard, "hjelp-forside.png");

    await gotoTab(page, "planlegger-samlinger");
    await page.waitForSelector("text=Opprett ny samling", { timeout: 30000 });
    const createGathering = page.locator("text=Opprett ny samling").locator("xpath=ancestor::form[1]");
    await shotLocator(createGathering, "hjelp-arrangementer.png");

    await gotoTab(page, "planlegger-oppgaver");
    await page.waitForSelector("text=Oppgaver & Frivilligoversikt", { timeout: 30000 });
    const firstTask = page.locator('button:has-text("Tildel")').first().locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]");
    await shotLocator(firstTask, "hjelp-oppgaver.png");

    await gotoTab(page, "planlegger-grupper");
    await page.waitForSelector("text=Grupper & Fellesskap", { timeout: 30000 });
    const firstGroup = page.locator('a:has-text("Administrer gruppe")').first().locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]");
    await shotLocator(firstGroup, "hjelp-grupper.png");

    await gotoTab(page, "planlegger-personer");
    await page.waitForSelector("text=Personregister", { timeout: 30000 });
    await page.getByRole("button", { name: "Tabell" }).click();
    await page.waitForSelector("table", { timeout: 15000 });
    const personTable = page.locator("table").first();
    const tableBox = await personTable.boundingBox();
    const lastRow = personTable.locator("tbody tr").nth(3);
    const rowBox = await lastRow.boundingBox();
    if (!tableBox || !rowBox) throw new Error("Personregister-tabellen ble ikke funnet");
    await shotClip(page, {
      x: tableBox.x,
      y: tableBox.y,
      width: tableBox.width,
      height: rowBox.y + rowBox.height - tableBox.y,
    }, "hjelp-personer.png");

    await gotoTab(page, "analyse");
    await page.waitForSelector("text=Analysebord", { timeout: 30000 });
    await shotLocator(page.locator('section[aria-labelledby="analyse-oppmote"]'), "hjelp-analysebord.png");
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
