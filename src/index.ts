import { scrapeCookiesAndQueries } from './apolloStudio/scraping';
import { fetchQueryMetadata as timingFetchQueryMetadata } from './dao/timingHintsDAO';

export { storeResults } from './store/s3Store';

export async function fetchTimingHints() {
  const { cookies, queries } = await scrapeCookiesAndQueries();
  return timingFetchQueryMetadata(queries.timingHints.hash, cookies);
}
