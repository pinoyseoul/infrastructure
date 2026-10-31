import type { Attribution, Collection, InitialData } from 'types';

import React from 'react';

import * as ReactBeautifulDnD from 'react-beautiful-dnd';
import ReactDOMServer from 'react-dom/server';

import { isProd } from 'utils/environment';

export const renderToNodeStream = (res, reactElement) => {
	res.setHeader('content-type', 'text/html');
	res.write('<!DOCTYPE html>');
	ReactBeautifulDnD.resetServerContext();
	return ReactDOMServer.renderToNodeStream(reactElement).pipe(res);
};

type MetaProps = {
	initialData: InitialData;
	title: string;
	contextTitle?: string | null;
	description?: string | null;
	image?: string | null;
	attributions?: Attribution[];
	doi?: string | null;
	publishedAt?: null | Date;
	unlisted?: boolean;
	collection?: Collection;
	pdfDownloadUrl?: string;
	textAbstract?: string;
	notes?: string[];
	canonicalUrl?: string;
};

const contributorRoles = ['Writing – Review & Editing', 'Editor', 'Series Editor'];
const sortAttributions = (foo: Attribution, bar: Attribution) => {
	if (foo.order < bar.order) {
		return -1;
	}
	if (foo.order > bar.order) {
		return 1;
	}
	if (foo.createdAt < bar.createdAt) {
		return 1;
	}
	if (foo.createdAt > bar.createdAt) {
		return -1;
	}
	return 0;
};

export const generateMetaComponents = (metaProps: MetaProps) => {
	const {
		initialData,
		title,
		contextTitle,
		description,
		image,
		attributions,
		doi,
		publishedAt,
		unlisted,
		collection,
		pdfDownloadUrl,
		textAbstract,
		notes,
		canonicalUrl,
	} = metaProps;

	const {
		title: communityTitle,
		citeAs: communityCiteAs,
		publishAs: communityPublisher,
		twitter: communityTwitter,
	} = initialData.communityData;

	const url = `https://${initialData.locationData.hostname}${initialData.locationData.path}`;
	const isPub = !!initialData.scopeData?.elements?.activePub;
	const useCollectionTitle = !isPub && collection?.title;
	const favicon = initialData.communityData.favicon;
	const imageOrAvatar = image || initialData.communityData.avatar;
	const twitterCardType = image ? 'summary_large_image' : 'summary';
	const titleWithContext = contextTitle ? `${title} · ${contextTitle}` : title;
	let outputComponents: any[] = [];
	if (!initialData.locationData.isBasePubPub) {
		outputComponents = [
			...outputComponents,
			<link
				key="rss1"
				rel="alternate"
				type="application/rss+xml"
				title={`${title} RSS Feed`}
				href={`https://${initialData.locationData.hostname}/rss.xml`}
			/>,
		];
	}

	if (title) {
		outputComponents = [
			...outputComponents,
			<title key="t1">{titleWithContext}</title>,
			<meta
				key="t2"
				property="og:title"
				content={useCollectionTitle ? (collection.title ?? undefined) : title}
			/>,
			<meta key="t3" name="twitter:title" content={titleWithContext} />,
			<meta key="t4" name="twitter:image:alt" content={titleWithContext} />,
			<meta
				key="t5"
				name="citation_title"
				content={useCollectionTitle ? (collection.title ?? undefined) : title}
			/>,
			<meta
				key="t6"
				name="dc.title"
				content={useCollectionTitle ? (collection.title ?? undefined) : title}
			/>,
		];
	}

	if (communityTitle) {
		outputComponents = [
			...outputComponents,
			<meta key="sn1" property="og:site_name" content={communityTitle} />,
		];
	}

	if (communityTitle && !collection) {
		outputComponents = [
			...outputComponents,
			<meta key="sn2" name="citation_journal_title" content={communityTitle} />,
		];
	}

	if (url) {
		outputComponents = [
			...outputComponents,
			<meta key="u1" property="og:url" content={url} />,
			<meta
				key="u2"
				property="og:type"
				content={collection?.kind === 'book' ? 'book' : isPub ? 'article' : 'website'}
			/>,
			<meta key="gs1" name="citation_abstract_html_url" content={url} />,
			<meta key="gs2" name="citation_fulltext_html_url" content={url} />,
		];
	}

	if (collection) {
		outputComponents = [
			...outputComponents,
			<meta key="c0" name="citation_publisher" content={communityPublisher || 'PubPub'} />,
		];
		if (collection.kind === 'issue') {
			outputComponents = [
				...outputComponents,
				<meta
					key="c1"
					name="citation_journal_title"
					content={communityCiteAs ?? undefined}
				/>,
				<meta key="c2" name="citation_volume" content={collection.metadata?.volume} />,
				<meta key="c3" name="citation_issue" content={collection.metadata?.issue} />,
				<meta
					key="c4"
					name="citation_issn"
					content={collection.metadata?.electronicIssn}
				/>,
				<meta key="c5" name="citation_issn" content={collection.metadata?.printIssn} />,
				<meta
					key="c6"
					name="citation_date"
					content={collection.metadata?.publicationDate}
				/>,
			];
		}
		if (collection.kind === 'book') {
			outputComponents = [
				...outputComponents,
				<meta
					key="c7"
					name="citation_book_title"
					content={collection.title ?? undefined}
				/>,
				<meta key="c8" name="citation_isbn" content={collection.metadata?.isbn} />,
				<meta
					key="c9"
					name="citation_date"
					content={collection.metadata?.publicationDate}
				/>,
			];
		}
		if (collection.kind === 'conference') {
			outputComponents = [
				...outputComponents,
				<meta
					key="c10"
					name="citation_conference_title"
					content={collection.title ?? undefined}
				/>,
				<meta
					key="c11"
					name="citation_conferenceName"
					content={collection.title ?? undefined}
				/>,
				<meta
					key="c12"
					name="citation_date"
					content={collection.metadata?.date ?? undefined}
				/>,
			];
		}
	}

	if (pdfDownloadUrl) {
		outputComponents = [
			...outputComponents,
			<meta key="dl1" name="citation_pdf_url" content={pdfDownloadUrl} />,
		];
	}

	if (textAbstract) {
		outputComponents = [
			...outputComponents,
			<meta key="a1" name="citation_abstract" content={textAbstract} />,
		];
	}

	if (communityTwitter) {
		outputComponents = [
			...outputComponents,
			<meta name="twitter:creator" content={`@${communityTwitter}`} />,
		];
	}

	if (description) {
		outputComponents = [
			...outputComponents,
			<meta key="d1" name="description" content={description} />,
			<meta key="d2" property="og:description" content={description} />,
			<meta key="d3" name="twitter:description" content={description} />,
		];
	}

	if (imageOrAvatar) {
		outputComponents = [
			...outputComponents,
			<meta key="i1" property="og:image" content={imageOrAvatar} />,
			<meta key="i2" property="og:image:url" content={imageOrAvatar} />,
			<meta key="i3" property="og:image:width" content="500" />,
			<meta key="i4" name="twitter:image" content={imageOrAvatar} />,
		];
	}

	if (favicon) {
		outputComponents = [
			...outputComponents,
			<link key="f1" rel="icon" type="image/png" sizes="256x256" href={favicon} />,
		];
	}

	if (attributions) {
		const authors: Attribution[] = [];
		const contributors: Attribution[] = [];

		const getPrimaryRole = (contributor: Attribution) => contributor.roles?.[0];

		attributions.sort(sortAttributions).forEach((attribution) => {
			if (!attribution.isAuthor) {
				return;
			}
			const primaryRole = getPrimaryRole(attribution);
			if (primaryRole && contributorRoles.includes(primaryRole)) {
				contributors.push(attribution);
			} else {
				authors.push(attribution);
			}
		});

		const citationAuthorTags = authors.flatMap((author) => {
			const authorName = author.user ? author.user.fullName : (author.name ?? undefined);
			const tags = [
				<meta
					key={`author-cite-${author.id}`}
					name="citation_author"
					content={authorName}
				/>,
			];
			const institution =
				(author.user as any)?.affiliation ||
				(author.user as any)?.affiliations?.[0]?.organization;
			if (institution) {
				tags.push(
					<meta
						key={`author-inst-${author.id}`}
						name="citation_author_institution"
						content={institution}
					/>,
				);
			}
			const orcid = author.user?.orcid;
			if (orcid) {
				tags.push(
					<meta
						key={`author-orcid-${author.id}`}
						name="citation_author_orcid"
						content={orcid}
					/>,
				);
			}
			return tags;
		});
		const dcAuthorTags = authors.map((author) => {
			if (author.user) {
				return (
					<meta
						key={`author-dc-${author.id}`}
						name="dc.creator"
						content={author.user.fullName}
					/>
				);
			}
			return (
				<meta
					key={`author-dc-${author.id}`}
					name="dc.creator"
					content={author.name ?? undefined}
				/>
			);
		});
		const contributorRoleTags = contributors.map((contributor) => {
			if (contributor.user) {
				return (
					<meta
						key={`editor-cite-${contributor.id}`}
						name="citation_editor"
						content={contributor.user.fullName}
					/>
				);
			}
			return (
				<meta
					key={`editor-cite-${contributor.id}`}
					name="citation_editor"
					content={contributor.name ?? undefined}
				/>
			);
		});
		outputComponents = [
			...outputComponents,
			citationAuthorTags,
			dcAuthorTags,
			contributorRoleTags,
		];
	}

	if (publishedAt) {
		const year = publishedAt.getFullYear();
		const month = String(publishedAt.getMonth() + 1).padStart(2, '0');
		const day = String(publishedAt.getDate()).padStart(2, '0');
		const googleScholarPublishedAt = `${year}/${month}/${day}`;
		const dcPublishedAt = `${year}-${month}-${day}`;
		outputComponents = [
			...outputComponents,
			<meta key="pa1" property="article:published_time" content={publishedAt.toISOString()} />,
			<meta key="pa2" property="dc.date" content={dcPublishedAt} />,
			<meta key="pa3" name="citation_publication_date" content={googleScholarPublishedAt} />,
			<meta key="pub1" property="dc.publisher" content={communityPublisher || communityTitle || 'OpenScience'} />,
		];
	}

	const finalDoi = doi || collection?.metadata?.doi;

	if (finalDoi) {
		if (finalDoi.startsWith('10.')) {
			outputComponents = [
				...outputComponents,
				<meta key="doi1" name="citation_doi" content={`doi:${finalDoi}`} />,
				<meta key="doi2" property="dc.identifier" content={`doi:${finalDoi}`} />,
				<meta key="doi3" property="prism.doi" content={`doi:${finalDoi}`} />,
			];
		} else if (finalDoi.startsWith('ark:')) {
			outputComponents = [
				...outputComponents,
				<meta key="ark1" name="citation_ark" content={finalDoi} />,
				<meta key="ark2" property="dc.identifier" content={finalDoi} />,
			];
		}
	}
	if (notes) {
		const citationNoteTags = notes.map((note, i) => {
			return <meta key={`n${i}-${note}`} name="citation_reference" content={note} />;
		});
		outputComponents = [...outputComponents, citationNoteTags];
	}
	if (!isProd() || unlisted || initialData.communityData.cmsMode) {
		outputComponents = [
			...outputComponents,
			<meta key="un1" name="robots" content="noindex,nofollow" />,
		];
	}

	if (canonicalUrl) {
		outputComponents = [...outputComponents, <link rel="canonical" href={canonicalUrl} />];
	}

	if (isPub) {
		const schemaOrgJson = {
			'@context': 'https://schema.org',
			'@type': 'ScholarlyArticle',
			headline: title,
			name: title,
			description: textAbstract || description || undefined,
			datePublished: publishedAt ? publishedAt.toISOString() : undefined,
			url: url || undefined,
			sameAs: finalDoi
				? finalDoi.startsWith('ark:')
					? `https://n2t.net/${finalDoi}`
					: `https://doi.org/${finalDoi}`
				: undefined,
			identifier: finalDoi
				? {
						'@type': 'PropertyValue',
						propertyID: finalDoi.startsWith('ark:') ? 'ARK' : 'DOI',
						value: finalDoi,
				  }
				: undefined,
			author: (attributions || [])
				.filter((a) => a.isAuthor)
				.map((a) => ({
					'@type': 'Person',
					name: a.user ? a.user.fullName : a.name,
					sameAs: a.user?.orcid ? `https://orcid.org/${a.user.orcid}` : undefined,
					affiliation:
						(a.user as any)?.affiliation || (a.user as any)?.affiliations?.[0]?.organization
							? {
									'@type': 'Organization',
									name:
										(a.user as any)?.affiliation ||
										(a.user as any)?.affiliations?.[0]?.organization,
							  }
							: undefined,
				})),
			publisher: {
				'@type': 'Organization',
				name: communityPublisher || communityTitle || 'OpenScience',
			},
		};

		outputComponents.push(
			<script
				key="schema-ld-json"
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrgJson) }}
			/>,
		);
	}

	outputComponents = [
		...outputComponents,
		<meta key="misc2" name="twitter:card" content={twitterCardType} />,
	];

	return outputComponents;
};
