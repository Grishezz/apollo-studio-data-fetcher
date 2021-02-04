require('dotenv').config();

// eslint-disable-next-line import/first
import { fetchTimingHints, storeResults } from '.';

(async () => {
  const timingHints = await fetchTimingHints();
  await storeResults(timingHints);
})();
