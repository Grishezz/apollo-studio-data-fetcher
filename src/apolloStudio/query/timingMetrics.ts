import axios from 'axios';
import config from 'config';
import { merge } from 'lodash';
import { QueryMetadata } from '../../schema/queriesMetadataGenerator';

const instance = axios.create({
  timeout: 30000
});

export async function fetchAndExtract(
  queryMetadata: QueryMetadata,
  timingHintsQueryHash: string,
  cookies: any,
  queryMetadataResult: Record<string, number>
): Promise<Record<string, number>> {
  const axiosResponse = await fetchMetrics(queryMetadata, timingHintsQueryHash, cookies.cookies);
  if (axiosResponse.data.errors) {
    throw new Error(`Error while fetching ${queryMetadata.query} cause:${JSON.stringify(axiosResponse.data.errors)}`);
  }
  if (axiosResponse.data.data) {
    if (axiosResponse.data.data.service.stats.fieldStats.length) {
      const fieldStats = axiosResponse.data.data.service.stats.fieldStats.reduce(
        (acc: any, currentValue: FieldStat) => ({
          ...acc,
          [getFieldKey(currentValue)]: getDurationMs(currentValue)
        }),
        queryMetadataResult
      );
      // eslint-disable-next-line no-param-reassign
      queryMetadataResult = merge(queryMetadataResult, fieldStats);
    } else {
      console.info(
        `No timingHints results for "${queryMetadata.query}" (this could be due to not enough usage for Apollo Studio to collect statistics...)`
      );
    }
  }
  return queryMetadataResult;
}

async function fetchMetrics(queryMetadata: QueryMetadata, timingHintsQueryHash: string, cookies: any) {
  const cookieHeader = buildCookiesHeader(cookies);
  const fieldsSelector = prepareFieldSelector(queryMetadata);

  const queryData = {
    operationName: 'TimingHintsQuery',
    variables: {
      graphId: config.get('apollo.studio.variant'),
      filter: {
        or: fieldsSelector
      },
      percentile: config.get('apollo.timingHintsQuery.percentile')
    },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash: timingHintsQueryHash
      }
    }
  };
  return instance.post(config.get('apollo.graphqlUrl'), queryData, {
    headers: {
      'Content-Type': 'application/json',
      cookie: cookieHeader
    }
  });
}

function buildCookiesHeader(cookies: any) {
  return cookies.map((cookie: any) => `${cookie.name}=${cookie.value};`).join(' ');
}

/*
 Prepares field selector in this format:
   {
     'field': 'Member.user:User!'
   },
   {
     'field': 'Query.members:[Member!]!'
   }
*/
function prepareFieldSelector(queryMetadata: QueryMetadata) {
  return [
    ...queryMetadata.fields!.map((field) => ({
      field: `${queryMetadata.underlyingType}.${field.field}:${field.type}`
    })),
    { field: `Query.${queryMetadata.query}:${queryMetadata.type}` }
  ];
}

function getFieldKey(fieldStat: FieldStat) {
  const fieldWithType = fieldStat.groupBy.field;
  return fieldWithType.split(':')[0]; // e.g. Member.user:User! => Member.user
}

function getDurationMs(fieldStat: FieldStat): number {
  return fieldStat.metrics.fieldHistogram.durationMs;
}

type FieldStat = { groupBy: { field: string }; metrics: { fieldHistogram: { durationMs: number } } };
