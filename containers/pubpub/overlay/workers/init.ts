require('./environment');
require('./queue');

// In-process periodic refresh of PostgreSQL analytics materialized views
const { createSummaryViews, refreshSummaryViews } = require('server/analytics/summaryViews');

const runAnalyticsRefresh = async () => {
	try {
		await createSummaryViews();
		await refreshSummaryViews();
		console.log('[worker] Analytics summary materialized views refreshed successfully.');
	} catch (err) {
		console.error('[worker] Failed to refresh summary views:', err);
	}
};

// Initial delayed run 30s after boot, then recurring every 12 hours
setTimeout(runAnalyticsRefresh, 30000);
setInterval(runAnalyticsRefresh, 12 * 60 * 60 * 1000);
