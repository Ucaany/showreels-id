import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = process.env.RESPONSIVE_BASE_URL || "http://localhost:3000";
const outputDir = process.env.RESPONSIVE_OUTPUT_DIR || "screenshots/responsive";
const routes = (process.env.RESPONSIVE_ROUTES || "/,/videos,/auth/login,/auth/signup,/pricing")
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean);

const viewports = [
  { width: 320, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 820, height: 1180 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

function slugifyRoute(route) {
  if (route === "/") return "home";
  return route.replace(/^\/+/, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "page";
}

async function findOverflowElements(page) {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    return Array.from(document.body.querySelectorAll("*"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === "string" ? element.className.slice(0, 120) : "",
          text: (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter((item) => item.width > 0 && (item.right > viewportWidth + 1 || item.left < -1))
      .slice(0, 8);
  });
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
  const page = await browser.newPage();
  const failures = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      failures.push(`console error: ${message.text()}`);
    }
  });

  for (const route of routes) {
    const routeName = slugifyRoute(route);
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      const url = new URL(route, baseUrl).toString();
      const response = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch((error) => {
        failures.push(`${route} ${viewport.width}: navigation failed (${error.message})`);
        return null;
      });

      if (!response || !response.ok()) {
        failures.push(`${route} ${viewport.width}: HTTP ${response?.status() || "no response"}`);
      }

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      if (overflow) {
        const elements = await findOverflowElements(page);
        failures.push(`${route} ${viewport.width}: horizontal overflow ${JSON.stringify(elements)}`);
      }

      await page.screenshot({
        path: path.join(outputDir, `${routeName}-${viewport.width}.png`),
        fullPage: true,
      });
    }
  }

  await browser.close();

  if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exit(1);
  }

  console.log(`Responsive screenshots saved to ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
