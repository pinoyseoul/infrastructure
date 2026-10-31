import type { Community as CommunityType } from 'types';

import { Router } from 'express';
import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';

import { Community, Page, Pub, Release } from 'server/models';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { wrap } from 'server/wrap';
import { communityUrl, pageUrl, pubUrl } from 'utils/canonicalUrls';

export const router = Router();

interface CachedSitemap {
	xml: string;
	timestamp: number;
}

const sitemapCache = new Map<string, CachedSitemap>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const buildSitemapXml = async (community: CommunityType): Promise<string> => {
	const cached = sitemapCache.get(community.id);
	if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
		return cached.xml;
	}

	const hostname = communityUrl(community);
	const pubs = await Pub.findAll({
		where: {
			communityId: community.id,
		},
		include: [
			{
				model: Release,
				as: 'releases',
				required: true,
				attributes: [],
			},
		],
		attributes: ['slug', 'updatedAt'],
	});

	const pages = await Page.findAll({
		where: {
			communityId: community.id,
			isPublic: true,
		},
		attributes: ['slug', 'updatedAt'],
	});

	const smStream = new SitemapStream({ hostname });

	const urls = [
		{
			url: '/',
			changefreq: 'daily',
			priority: 1.0,
		},
		...pubs.map((pub) => ({
			url: pubUrl(community, pub),
			changefreq: 'weekly',
			priority: 0.9,
			lastmod: pub.updatedAt ? new Date(pub.updatedAt).toISOString() : undefined,
		})),
		...pages.map((page) => ({
			url: pageUrl(community, page),
			changefreq: 'monthly',
			priority: 0.7,
			lastmod: page.updatedAt ? new Date(page.updatedAt).toISOString() : undefined,
		})),
	];

	const xmlBuffer = await streamToPromise(Readable.from(urls).pipe(smStream));
	const xml = xmlBuffer.toString();

	sitemapCache.set(community.id, {
		xml,
		timestamp: Date.now(),
	});

	return xml;
};

const buildPortalSitemapXml = async (hostname: string): Promise<string> => {
	const cached = sitemapCache.get(`portal:${hostname}`);
	if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
		return cached.xml;
	}

	const communities = await Community.findAll({
		attributes: ['subdomain', 'domain', 'updatedAt'],
	});

	const smStream = new SitemapStream({ hostname: `https://${hostname}` });
	const baseDomain = hostname.includes('.') ? hostname.substring(hostname.indexOf('.') + 1) : hostname;

	const urls = [
		{
			url: '/',
			changefreq: 'daily',
			priority: 1.0,
		},
		...communities.map((c) => ({
			url: c.domain ? `https://${c.domain}` : `https://${c.subdomain}.${baseDomain}`,
			changefreq: 'daily',
			priority: 0.9,
			lastmod: c.updatedAt ? new Date(c.updatedAt).toISOString() : undefined,
		})),
	];

	const xmlBuffer = await streamToPromise(Readable.from(urls).pipe(smStream));
	const xml = xmlBuffer.toString();

	sitemapCache.set(`portal:${hostname}`, {
		xml,
		timestamp: Date.now(),
	});

	return xml;
};

router.get(
	['/sitemap.xml', '/sitemap-index.xml', '/sitemap*'],
	wrap(async (req, res) => {
		if (hostIsValid(req, 'community')) {
			const { communityData } = await getInitialData(req, { isDashboard: true });
			if (communityData?.cmsMode) {
				return res.sendStatus(404);
			}

			try {
				const xml = await buildSitemapXml(communityData);
				res.header('Content-Type', 'application/xml');
				return res.status(200).send(xml);
			} catch (err) {
				console.error('[sitemap] Failed to generate community sitemap:', err);
				return res.sendStatus(500);
			}
		}

		// Base platform portal sitemap (e.g. journal.pinoyseoul.com)
		try {
			const xml = await buildPortalSitemapXml(req.hostname);
			res.header('Content-Type', 'application/xml');
			return res.status(200).send(xml);
		} catch (err) {
			console.error('[sitemap] Failed to generate portal sitemap:', err);
			return res.sendStatus(500);
		}
	}),
);
