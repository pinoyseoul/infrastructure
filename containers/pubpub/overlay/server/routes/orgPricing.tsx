import React from 'react';

import { Router } from 'express';

import Html from 'server/Html';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

router.get('/orgs/pricing', async (req, res, next) => {
	if (!hostIsValid(req, 'pubpub')) {
		return next();
	}

	try {
		const initialData = await getInitialData(req);

		return renderToNodeStream(
			res,
			<Html
				chunkName="OrgPricing"
				initialData={initialData}
				headerComponents={generateMetaComponents({
					initialData,
					title: 'Institutional Consortia · OpenScience.ph',
					description:
						'Consortia partnership frameworks for OpenScience.ph Institutional Portals — dedicated tooling for university libraries and consortia.',
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
