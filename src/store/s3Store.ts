import aws from 'aws-sdk';
import config from 'config';

const S3 = new aws.S3({ region: config.get('store.s3.region') });

export function storeResults(timingMetrics: Record<string, number>) {
  return S3.putObject({
    Bucket: config.get('store.s3.bucket'),
    Key: 'timingMetrics.json',
    Body: JSON.stringify(timingMetrics)
  }).promise();
}
