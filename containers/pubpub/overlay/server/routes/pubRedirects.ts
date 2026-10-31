import type { DefinitelyHas } from 'types';

import { Router } from 'express';
import queryString, { type ParsedQuery } from 'query-string';
import { Op } from 'sequelize';

import { Community, Pub, Release } from 'server/models';
import { handleErrors } from 'server/utils/errors';
import { hostIsValid } from 'server/utils/routes';
import { isDuqDuq } from 'utils/environment';

export const router = Router();

const getParams = (req) => {
	const hostname = isDuqDuq()
		? `https://${req.hostname.replace('pubpub.org', 'duqduq.org')}`
		: `https://${req.hostname}`;
	return {
		slug: req.params.slug.toLowerCase(),
		versionNumber: req.params.versionNumber,
		manageMode: req.params.manageMode,
		domain: req.headers.localhost ? `http://${req.headers.localhost}` : hostname,
	};
};

/* Redirect /pub/slug paths on www.pubpub.org */
router.get('/pub/:slug', async (req, res, next) => {
	if (!hostIsValid(req, 'pubpub')) {
		return next();
	}
	try {
		const cleanSlug = req.params.slug
			.replace(/_/gi, '-')
			.replace(/^(j1|journal)\/?/, '')
			.toLowerCase();
		const pubData = (await Pub.findOne({
			/* The replace statement is to capture v3 pub slug conventions */
			where: { slug: cleanSlug },
			attributes: ['id'],
			include: [{ model: Community, as: 'community', attributes: ['subdomain', 'domain'] }],
		})) as DefinitelyHas<Pub, 'community'>;
		if (pubData) {
			const baseDomain = process.env.BASE_DOMAIN || 'pinoyseoul.com';
			const newDomain = pubData.community.domain
				? pubData.community.domain
				: `${pubData.community.subdomain}.${baseDomain}`;
			return res.redirect(`https://${newDomain}/pub/${cleanSlug}`);
		}
		return next();
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

/* Redirect /pub/slug paths on communities to appropriate release or draft */
router.get('/pub/:slug', async (req, res, next) => {
	if (!hostIsValid(req, 'community')) {
		return next();
	}
	try {
		const { slug, domain } = getParams(req);
		const prefix = `${domain}/pub/${slug}`;
		const pubData = await Pub.findOne({
			where: { slug },
			attributes: ['id'],
			include: [{ model: Release, as: 'releases' }],
		});
		if (!pubData) {
			throw new Error('Pub Not Found');
		}

		const baseUrl =
			pubData.releases && pubData.releases.length
				? `${prefix}/release/${pubData.releases.length}`
				: `${prefix}/draft`;

		const redirectUrl = queryString.stringifyUrl({
			url: baseUrl,
			query: req.query as ParsedQuery,
		});
		return res.redirect(redirectUrl);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

/* Resolve Archival Resource Keys (e.g. /ark:/14373/j1ykzenf63 or .v1) */
router.get(/^\/ark:(\/)?([0-9]+)\/([a-zA-Z0-9_\-\.]+)/i, async (req, res, next) => {
	try {
		const naan = req.params[1];
		const name = req.params[2];
		const fullArk = `ark:/${naan}/${name}`.toLowerCase();
		const pubData = (await Pub.findOne({
			where: {
				doi: { [Op.iLike]: fullArk },
			},
			attributes: ['id', 'slug'],
			include: [{ model: Community, as: 'community', attributes: ['subdomain', 'domain'] }],
		})) as DefinitelyHas<Pub, 'community'>;
		if (pubData) {
			const baseDomain = process.env.BASE_DOMAIN || 'pinoyseoul.com';
			const targetDomain = pubData.community.domain
				? pubData.community.domain
				: `${pubData.community.subdomain}.${baseDomain}`;
			return res.redirect(301, `https://${targetDomain}/pub/${pubData.slug}`);
		}
		return next();
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

/* Redirect legacy /pub/slug/branch routes */
router.get(
	['/pub/:slug/branch/:branchShortId', '/pub/:slug/branch/:branchShortId/:versionNumber'],
	async (req, res, next) => {
		if (!hostIsValid(req, 'community')) {
			return next();
		}
		try {
			const { slug, domain, versionNumber } = getParams(req);
			const prefix = `${domain}/pub/${slug}`;
			const pubData = await Pub.findOne({
				where: { slug },
				attributes: ['id', 'slug', 'viewHash', 'editHash'],
			});

			if (!pubData) {
				throw new Error('Pub Not Found');
			}

			const baseUrl = versionNumber
				? `${prefix}/release/${parseInt(versionNumber, 10)}`
				: prefix;

			const redirectUrl = queryString.stringifyUrl({
				url: baseUrl,
				query: req.query as ParsedQuery,
			});
			return res.redirect(redirectUrl);
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	},
);

/* Redirect /pub/slug/manage  */
router.get(['/pub/:slug/manage/', '/pub/:slug/manage/:manageMode'], async (req, res, next) => {
	if (!hostIsValid(req, 'community')) {
		return next();
	}
	try {
		const { slug, domain, manageMode } = getParams(req);
		const modeString = manageMode ? `/${manageMode}` : '';
		return res.redirect(`${domain}/dash/pub/${slug}/settings${modeString}`);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
