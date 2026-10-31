import { Router } from 'express';
import xmlbuilder from 'xmlbuilder';

import { Collection, CollectionPub, Community, Pub, PubAttribution, Release, User } from 'server/models';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { wrap } from 'server/wrap';
import { communityUrl, pubUrl } from 'utils/canonicalUrls';

export const router = Router();

const OAI_NAMESPACE = 'http://www.openarchives.org/OAI/2.0/';
const OAI_XSI = 'http://www.w3.org/2001/XMLSchema-instance';
const OAI_SCHEMA_LOCATION = 'http://www.openarchives.org/OAI/2.0/ http://www.openarchives.org/OAI/2.0/OAI-PMH.xsd';
const DC_NAMESPACE = 'http://purl.org/dc/elements/1.1/';
const OAI_DC_NAMESPACE = 'http://www.openarchives.org/OAI/2.0/oai_dc/';
const OAI_DC_SCHEMA_LOCATION = 'http://www.openarchives.org/OAI/2.0/oai_dc/ http://www.openarchives.org/OAI/2.0/oai_dc.xsd';

const createBaseOaiXml = (baseUrl: string, verb?: string, params: Record<string, string | undefined> = {}) => {
	const root = xmlbuilder.create('OAI-PMH', { version: '1.0', encoding: 'UTF-8' });
	root.att('xmlns', OAI_NAMESPACE);
	root.att('xmlns:xsi', OAI_XSI);
	root.att('xsi:schemaLocation', OAI_SCHEMA_LOCATION);

	root.ele('responseDate', new Date().toISOString());

	const reqEle = root.ele('request', baseUrl);
	if (verb) {
		reqEle.att('verb', verb);
	}
	for (const [key, val] of Object.entries(params)) {
		if (val && key !== 'verb') {
			reqEle.att(key, val);
		}
	}

	return root;
};

const sendOaiError = (res: any, baseUrl: string, code: string, message: string, verb?: string) => {
	const root = createBaseOaiXml(baseUrl, verb);
	root.ele('error', { code }, message);
	res.header('Content-Type', 'application/xml');
	return res.status(200).send(root.end({ pretty: true }));
};

const formatOaiIdentifier = (hostname: string, pubSlug: string) => `oai:${hostname}:pub/${pubSlug}`;

const parseOaiIdentifier = (identifier: string) => {
	const match = identifier.match(/pub\/([^/]+)$/) || identifier.match(/:([^:]+)$/);
	return match ? match[1] : identifier;
};

const handleOaiRequest = async (req: any, res: any) => {
	const isCommunity = hostIsValid(req, 'community');
	let community: any = null;
	let repositoryName = 'OpenScience.ph Scholarly Commons';
	let communityWhere: any = {};
	let baseUrl = `https://${req.hostname}/oai`;

	if (isCommunity) {
		const initialData = await getInitialData(req);
		community = initialData.communityData;
		if (!community?.id || community.cmsMode) {
			return res.sendStatus(404);
		}
		repositoryName = community.title || 'OpenScience Repository';
		communityWhere = { communityId: community.id };
		baseUrl = `${communityUrl(community)}/oai`;
	}

	const hostname = req.hostname;
	const query = { ...req.query, ...req.body };
	const verb = query.verb as string | undefined;

	if (!verb) {
		return sendOaiError(res, baseUrl, 'badVerb', 'Missing OAI verb');
	}

	const adminEmail = (community && community.email) || process.env.WEBMASTER_EMAIL || 'admin@pinoyseoul.com';

	switch (verb) {
		case 'Identify': {
			const root = createBaseOaiXml(baseUrl, verb);
			const identify = root.ele('Identify');
			identify.ele('repositoryName', repositoryName);
			identify.ele('baseURL', baseUrl);
			identify.ele('protocolVersion', '2.0');
			identify.ele('adminEmail', adminEmail);
			identify.ele('earliestDatestamp', '2020-01-01T00:00:00Z');
			identify.ele('deletedRecord', 'persistent');
			identify.ele('granularity', 'YYYY-MM-DDThh:mm:ssZ');

			res.header('Content-Type', 'application/xml');
			return res.status(200).send(root.end({ pretty: true }));
		}

		case 'ListMetadataFormats': {
			const root = createBaseOaiXml(baseUrl, verb);
			const list = root.ele('ListMetadataFormats');
			const format = list.ele('metadataFormat');
			format.ele('metadataPrefix', 'oai_dc');
			format.ele('schema', 'http://www.openarchives.org/OAI/2.0/oai_dc.xsd');
			format.ele('metadataNamespace', OAI_DC_NAMESPACE);

			res.header('Content-Type', 'application/xml');
			return res.status(200).send(root.end({ pretty: true }));
		}

		case 'ListSets': {
			const collections = await Collection.findAll({
				where: { ...(community?.id ? { communityId: community.id } : {}), isPublic: true },
				attributes: ['slug', 'title', 'metadata'],
			});

			const root = createBaseOaiXml(baseUrl, verb);
			const listSets = root.ele('ListSets');
			for (const col of collections) {
				const set = listSets.ele('set');
				set.ele('setSpec', col.slug);
				set.ele('setName', col.title);
				const desc = col.metadata?.description || col.metadata?.summary;
				if (desc) {
					const setDesc = set.ele('setDescription');
					const dc = setDesc.ele('oai_dc:dc', {
						'xmlns:oai_dc': OAI_DC_NAMESPACE,
						'xmlns:dc': DC_NAMESPACE,
					});
					dc.ele('dc:description', String(desc));
				}
			}

			res.header('Content-Type', 'application/xml');
			return res.status(200).send(root.end({ pretty: true }));
		}

		case 'ListIdentifiers':
		case 'ListRecords': {
			const metadataPrefix = query.metadataPrefix as string | undefined;
			if (!metadataPrefix) {
				return sendOaiError(res, baseUrl, 'badArgument', 'metadataPrefix is required', verb);
			}
			if (metadataPrefix !== 'oai_dc') {
				return sendOaiError(res, baseUrl, 'cannotDisseminateFormat', 'Only oai_dc is supported', verb);
			}

			const pubs = await Pub.findAll({
				where: { ...communityWhere },
				include: [
					{
						model: Community,
						as: 'community',
						required: false,
						attributes: ['id', 'subdomain', 'domain', 'title'],
					},
					{
						model: Release,
						as: 'releases',
						required: true,
						attributes: ['id', 'createdAt'],
					},
					{
						model: PubAttribution,
						as: 'attributions',
						required: false,
						include: [{ model: User, as: 'user', required: false }],
					},
					{
						model: CollectionPub,
						as: 'collectionPubs',
						required: false,
						include: [{ model: Collection, as: 'collection', required: false }],
					},
				],
				order: [['createdAt', 'DESC']],
				limit: 100,
			});

			if (!pubs.length) {
				return sendOaiError(res, baseUrl, 'noRecordsMatch', 'No matching records found', verb);
			}

			const root = createBaseOaiXml(baseUrl, verb, { metadataPrefix });
			const container = root.ele(verb);

			for (const pub of pubs) {
				const date = pub.customPublishedAt || pub.releases?.[0]?.createdAt || pub.createdAt;
				const isoDate = new Date(date).toISOString();

				const header = verb === 'ListRecords' ? container.ele('record').ele('header') : container.ele('header');
				header.ele('identifier', formatOaiIdentifier(hostname, pub.slug));
				header.ele('datestamp', isoDate);

				for (const cp of pub.collectionPubs || []) {
					if (cp.collection?.slug) {
						header.ele('setSpec', cp.collection.slug);
					}
				}

				if (verb === 'ListRecords') {
					const metadata = header.up().ele('metadata');
					const dc = metadata.ele('oai_dc:dc', {
						'xmlns:oai_dc': OAI_DC_NAMESPACE,
						'xmlns:dc': DC_NAMESPACE,
						'xmlns:xsi': OAI_XSI,
						'xsi:schemaLocation': `${OAI_DC_NAMESPACE} ${OAI_DC_SCHEMA_LOCATION}`,
					});

					dc.ele('dc:title', pub.title || 'Untitled');

					for (const attr of pub.attributions || []) {
						if (attr.isAuthor) {
							const authorName = attr.user ? attr.user.fullName : attr.name;
							if (authorName) {
								dc.ele('dc:creator', authorName);
							}
						}
					}

					if (pub.description) {
						dc.ele('dc:description', pub.description);
					}

					const pubComm = (pub as any).community || community;
					const pubCanonicalUrl = pubComm ? pubUrl(pubComm, pub) : `https://${hostname}/pub/${pub.slug}`;

					dc.ele('dc:publisher', pubComm?.title || repositoryName);
					dc.ele('dc:date', isoDate.slice(0, 10));
					dc.ele('dc:type', 'info:eu-repo/semantics/article');

					const finalDoi = (pub as any).doi;
					if (finalDoi) {
						if (finalDoi.startsWith('ark:')) {
							dc.ele('dc:identifier', `https://n2t.net/${finalDoi}`);
						} else {
							dc.ele('dc:identifier', `https://doi.org/${finalDoi}`);
						}
					}

					dc.ele('dc:identifier', pubCanonicalUrl);
					dc.ele('dc:language', 'en');
					dc.ele('dc:rights', 'http://creativecommons.org/licenses/by/4.0/');
				}
			}

			res.header('Content-Type', 'application/xml');
			return res.status(200).send(root.end({ pretty: true }));
		}

		case 'GetRecord': {
			const metadataPrefix = query.metadataPrefix as string | undefined;
			const rawIdentifier = query.identifier as string | undefined;

			if (!rawIdentifier) {
				return sendOaiError(res, baseUrl, 'badArgument', 'identifier is required', verb);
			}
			if (!metadataPrefix) {
				return sendOaiError(res, baseUrl, 'badArgument', 'metadataPrefix is required', verb);
			}
			if (metadataPrefix !== 'oai_dc') {
				return sendOaiError(res, baseUrl, 'cannotDisseminateFormat', 'Only oai_dc is supported', verb);
			}

			const slug = parseOaiIdentifier(rawIdentifier);

			const pub = await Pub.findOne({
				where: {
					...communityWhere,
					slug,
				},
				include: [
					{
						model: Community,
						as: 'community',
						required: false,
						attributes: ['id', 'subdomain', 'domain', 'title'],
					},
					{
						model: Release,
						as: 'releases',
						required: true,
						attributes: ['id', 'createdAt'],
					},
					{
						model: PubAttribution,
						as: 'attributions',
						required: false,
						include: [{ model: User, as: 'user', required: false }],
					},
					{
						model: CollectionPub,
						as: 'collectionPubs',
						required: false,
						include: [{ model: Collection, as: 'collection', required: false }],
					},
				],
			});

			if (!pub) {
				return sendOaiError(res, baseUrl, 'idDoesNotExist', 'No matching record found', verb);
			}

			const root = createBaseOaiXml(baseUrl, verb, { identifier: rawIdentifier, metadataPrefix });
			const getRecord = root.ele('GetRecord');
			const record = getRecord.ele('record');

			const date = pub.customPublishedAt || pub.releases?.[0]?.createdAt || pub.createdAt;
			const isoDate = new Date(date).toISOString();

			const header = record.ele('header');
			header.ele('identifier', formatOaiIdentifier(hostname, pub.slug));
			header.ele('datestamp', isoDate);

			for (const cp of pub.collectionPubs || []) {
				if (cp.collection?.slug) {
					header.ele('setSpec', cp.collection.slug);
				}
			}

			const metadata = record.ele('metadata');
			const dc = metadata.ele('oai_dc:dc', {
				'xmlns:oai_dc': OAI_DC_NAMESPACE,
				'xmlns:dc': DC_NAMESPACE,
				'xmlns:xsi': OAI_XSI,
				'xsi:schemaLocation': `${OAI_DC_NAMESPACE} ${OAI_DC_SCHEMA_LOCATION}`,
			});

			dc.ele('dc:title', pub.title || 'Untitled');

			for (const attr of pub.attributions || []) {
				if (attr.isAuthor) {
					const authorName = attr.user ? attr.user.fullName : attr.name;
					if (authorName) {
						dc.ele('dc:creator', authorName);
					}
				}
			}

			if (pub.description) {
				dc.ele('dc:description', pub.description);
			}

			const pubComm = (pub as any).community || community;
			const pubCanonicalUrl = pubComm ? pubUrl(pubComm, pub) : `https://${hostname}/pub/${pub.slug}`;

			dc.ele('dc:publisher', pubComm?.title || repositoryName);
			dc.ele('dc:date', isoDate.slice(0, 10));
			dc.ele('dc:type', 'info:eu-repo/semantics/article');

			const finalDoi = (pub as any).doi;
			if (finalDoi) {
				if (finalDoi.startsWith('ark:')) {
					dc.ele('dc:identifier', `https://n2t.net/${finalDoi}`);
				} else {
					dc.ele('dc:identifier', `https://doi.org/${finalDoi}`);
				}
			}

			dc.ele('dc:identifier', pubCanonicalUrl);
			dc.ele('dc:language', 'en');
			dc.ele('dc:rights', 'http://creativecommons.org/licenses/by/4.0/');

			res.header('Content-Type', 'application/xml');
			return res.status(200).send(root.end({ pretty: true }));
		}

		default:
			return sendOaiError(res, baseUrl, 'badVerb', `Unsupported OAI verb: ${verb}`);
	}
};

router.get('/oai', wrap(handleOaiRequest));
router.post('/oai', wrap(handleOaiRequest));
