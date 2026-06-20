// Standalone price-snapshot capture. Run via `npm run db:snapshot` (cron-friendly).
import { captureSnapshots } from '../src/lib/snapshot';

captureSnapshots()
  .then(rows => {
    console.log(`[snapshot] ${new Date().toISOString()} captured ${rows.length} row(s):`,
      rows.map(r => `${r.scope}=৳${r.avgPrice} (n=${r.sampleSize})`).join(', ') || '(no listings)');
    process.exit(0);
  })
  .catch(err => {
    console.error('[snapshot] failed:', err);
    process.exit(1);
  });
