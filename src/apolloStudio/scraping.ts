import config from 'config';
import fs from 'fs';
import { get } from 'lodash';

import puppeteer, { Browser, Request } from 'puppeteer';

export async function scrapeCookiesAndQueries(): Promise<ScrapingResult> {
  const browser: Browser = await puppeteer.launch();
  const page = await newPage(browser);
  const timingHintsQueryHashPromise = listenOnTimingHintsQueryHash(page);

  await loginNavigateToExplorerPage(page);

  // @ts-ignore
  // eslint-disable-next-line no-underscore-dangle
  const cookies: any = await page._client.send('Network.getAllCookies');
  const timingHintsQueryHash = await timingHintsQueryHashPromise;

  await troubleshoot(cookies, page);
  await browser.close();

  return {
    cookies,
    queries: {
      timingHints: {
        hash: timingHintsQueryHash
      }
    }
  };
}

async function newPage(browser: puppeteer.Browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setRequestInterception(true);
  return page;
}

async function loginNavigateToExplorerPage(page: puppeteer.Page) {
  const apolloStudioExplorerUrl = `${config.get('apollo.studio.baseUrl')}/${config.get('apollo.studio.graph')}/explorer?variant=${config.get(
    'apollo.studio.variant'
  )}`;
  await page.goto(apolloStudioExplorerUrl);
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', config.get('apollo.studio.username'));
  await page.type('input[type="password"]', config.get('apollo.studio.password'));
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  await page.waitForSelector('#run-button');
}

function listenOnTimingHintsQueryHash(page: puppeteer.Page): Promise<string> {
  page.on('request', (request) => {
    request.continue();
  });
  return new Promise((resolve) => {
    page.on('response', async (response) => {
      if (response.url() === config.get('apollo.graphqlUrl') && response.request().method() === 'POST') {
        const body = await response.json();
        const stats = get(body, 'data.service.stats');
        if (stats) {
          const request: Request = response?.request()!;
          const timingHintsQueryHash: string = JSON.parse(request.postData()!).extensions.persistedQuery.sha256Hash;
          console.debug('got timingHintsQueryHash:', timingHintsQueryHash);
          resolve(timingHintsQueryHash);
        }
      }
    });
  });
}

async function troubleshoot(cookies: any, page: puppeteer.Page) {
  if (process.env.TROUBLESHOOT) {
    const cookieJson = JSON.stringify(cookies);
    fs.writeFileSync('cookies.json', cookieJson);
    await page.screenshot({ path: 'screenshot.png' });
  }
}

type ScrapingResult = { queries: { timingHints: { hash: string } }; cookies: any };
