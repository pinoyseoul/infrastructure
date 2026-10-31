import { Router } from 'express';
import stripIndent from 'strip-indent';

import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { wrap } from 'server/wrap';
import { communityUrl } from 'utils/canonicalUrls';
import { isProd } from 'utils/environment';

export const router = Router();

const buildRobotsFile = (community?: any, hostname?: string) => {
	if (!isProd()) {
		return stripIndent(`
			User-agent: *
			Disallow: /
		`).trim();
	}
	if (community?.cmsMode) {
		return stripIndent(`
			User-agent: *
			Disallow: /
		`).trim();
	}
	const baseUrl = community ? communityUrl(community) : (hostname ? `https://${hostname}` : '');
	return stripIndent(`
		User-agent: *
		Allow: /pub/
		Allow: /downloads/
		Disallow: /login?redirect=*
		Disallow: /dash/*
		Disallow: /admin/*
		${baseUrl ? `Sitemap: ${baseUrl}/sitemap.xml` : ''}
	`).trim();
};

router.get(
	'/robots.txt',
	wrap(async (req, res) => {
		let communityData;
		if (hostIsValid(req, 'community')) {
			const initData = await getInitialData(req, { isDashboard: true });
			communityData = initData.communityData;
		}

		res.header('Content-Type', 'text/plain');
		return res.send(buildRobotsFile(communityData, req.hostname));
	}),
);
