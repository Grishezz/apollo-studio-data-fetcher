import { eachLimit, asyncify, retry } from 'async';
import { fetchAndExtract } from '../apolloStudio/query/timingMetrics';
import { generateQueriesMetadata, QueryMetadata } from '../schema/queriesMetadataGenerator';

export async function fetchQueryMetadata(timingHintsQueryHash: string, cookies: any): Promise<Record<string, number>> {
  validateArgs(timingHintsQueryHash, cookies);
  const queriesMetadata = generateQueriesMetadata();
  const queryMetadataResult: Record<string, number> = {};
  // Use asyncify is necessary, as otherwise transpiled promises are mishandled by async.js functions!
  await eachLimit(
    Object.values(queriesMetadata),
    1,
    asyncify(async (queryMetadata: QueryMetadata) => {
      if (!queryMetadata.fields) {
        console.warn(`no fields found for ${queryMetadata.query}`); // E.g. union types?
        return;
      }
      try {
        // This is required as there is some throttling implemented on the apollo-studio graphql endpoint,
        //  and these requests often fail.
        await retry(
          {
            times: 5,
            interval: (retryCount) => retryCount * 1000
          },
          asyncify(async () => {
            // eslint-disable-next-line no-return-await
            await fetchAndExtract(queryMetadata, timingHintsQueryHash, cookies, queryMetadataResult);
          })
        );
      } catch (e) {
        console.error(e);
      }
      await sleep(1000);
    })
  );
  console.info(queryMetadataResult);
  return queryMetadataResult;
}

function validateArgs(timingHintsQueryHash: string, cookies: any) {
  if (!timingHintsQueryHash) {
    throw new Error('no timingHintsQueryHash was found!');
  }
  if (!cookies) {
    throw new Error('no cookies was found!');
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
