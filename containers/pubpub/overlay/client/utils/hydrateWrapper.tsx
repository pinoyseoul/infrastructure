import React from 'react';
import { hydrate } from 'react-dom';

import { FocusStyleManager } from '@blueprintjs/core';
import * as Sentry from '@sentry/react';

import { setAppCommit, setEnvironment } from 'utils/environment';

import { getClientInitialData } from './initialData';

const isStorybookEnv = (windowObj) =>
	windowObj.location.origin === 'http://localhost:9001' || windowObj.STORYBOOK_ENV === 'react';

const isLocalEnv = (windowObj) => windowObj.location.origin.indexOf('localhost:') > -1;

export const hydrateWrapper = (Component) => {
	if (typeof window !== 'undefined' && !isStorybookEnv(window)) {
		const initialData = getClientInitialData();
		const { isProd, isDuqDuq, isQubQub, appCommit } = initialData.locationData;
		setEnvironment(isProd, isDuqDuq, isQubQub);
		setAppCommit(appCommit);

		FocusStyleManager.onlyShowFocusOnTabs();

		/* Remove any leftover service workers from last PubPub instance */
		if (window.navigator && navigator.serviceWorker) {
			navigator.serviceWorker.getRegistrations().then((registrations) => {
				registrations.forEach((registration) => {
					registration.unregister();
				});
			});
		}

		// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
		const viewData = JSON.parse(document.getElementById('view-data').getAttribute('data-json'));
		const chunkName = JSON.parse(
			// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
			document.getElementById('chunk-name').getAttribute('data-json'),
		);
		const clientSentryDsn = (window as any).sentryDsn;
		if (!isLocalEnv(window) && clientSentryDsn) {
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'sentryIsActive' does not exist on type '... Remove this comment to see the full error message
			window.sentryIsActive = true;
			Sentry.init({
				dsn: clientSentryDsn,
				environment: isProd ? 'prod' : 'dev',
				release: appCommit,
			});
			Sentry.setUser({
				id: initialData.loginData.id,
				username: initialData.loginData.slug,
			});
		}

		hydrate(
			<Component initialData={initialData} viewData={viewData} chunkName={chunkName} />,
			document.getElementById('root'),
		);
	}
};
