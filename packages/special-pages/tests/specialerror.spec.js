import { test } from "@playwright/test";
import { SpecialErrorPage } from "./page-objects/specialerror";

test.describe("specialerror", () => {
  test("leaves site", async ({ page }, workerInfo) => {
    const special = SpecialErrorPage.create(page, workerInfo);
    await special.openPage('ssl');
    await special.leavesSite();
  });
  test("visits site", async ({ page }, workerInfo) => {
    const special = SpecialErrorPage.create(page, workerInfo);
    await special.openPage('ssl');
    await special.visitsSite();
  });
  test("opens phishing help page in a new window", async ({ page   }, workerInfo) => {
    const special = SpecialErrorPage.create(page, workerInfo);
    await special.openPage('phishing');
    await special.opensPhishingHelpPage();
  });
});
