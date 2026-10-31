import React, { useMemo, useState } from 'react';

import { getResizedUrl } from 'utils/images';

import './explore.scss';

type Community = {
	id: string;
	subdomain: string;
	domain: string | null;
	title: string;
	description: string | null;
	avatar: string | null;
	heroBackgroundImage: string | null;
	heroBackgroundColor: string | null;
	heroLogo: string | null;
	accentColorLight: string;
	accentColorDark: string;
	headerLogo: string | null;
	isFeatured: boolean | null;
	activityScore: number;
	createdAt: string;
	scopeSummary?: {
		pubs: number;
		collections: number;
		discussions: number;
		reviews: number;
		submissions: number;
	};
};

type Props = {
	exploreData: {
		communities: Community[];
	};
};

const PAGE_SIZE = 48;

const getCommunityUrl = (community: Community) => {
	if (community.domain) return `https://${community.domain}`;
	const base = (typeof window !== 'undefined' && window.location.hostname.includes('pinoyseoul.com'))
		? 'pinoyseoul.com'
		: 'openscience.ph';
	return `https://${community.subdomain}.${base}`;
};

const pickTextColor = (hex: string | null) => {
	if (!hex) return '#fff';
	const c = hex.replace('#', '');
	const r = parseInt(c.substring(0, 2), 16);
	const g = parseInt(c.substring(2, 4), 16);
	const b = parseInt(c.substring(4, 6), 16);
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return luminance > 0.55 ? '#1a1a2e' : '#fff';
};

const CommunityCard = ({ community }: { community: Community }) => {
	const url = getCommunityUrl(community);
	const logo = community.heroLogo
		? getResizedUrl(community.heroLogo, 'inside', 120)
		: community.avatar
			? getResizedUrl(community.avatar, 'inside', 120)
			: community.headerLogo
				? getResizedUrl(community.headerLogo, 'inside', 120)
				: null;
	const summary = community.scopeSummary;
	const bgColor = community.heroBackgroundColor || community.accentColorDark || '#2c3654';
	const accentDark = community.accentColorDark || '#2c3654';
	const textColor = pickTextColor(bgColor);
	const subtextColor = textColor === '#fff' ? 'rgba(255,255,255,0.85)' : 'rgba(26,26,46,0.7)';
	const gradient = `linear-gradient(150deg, ${bgColor} 0%, ${accentDark} 100%)`;

	return (
		<a className="community-card" href={url} style={{ background: gradient }}>
			<div className="card-content">
				<div className="card-header">
					{logo && <img className="card-logo" src={logo} alt="" />}
				</div>
				<div className="card-body">
					<span className="card-title" style={{ color: textColor }}>
						{community.title}
					</span>
					{community.description && (
						<span className="card-description" style={{ color: subtextColor }}>
							{community.description}
						</span>
					)}
				</div>
				<div className="card-footer" style={{ color: subtextColor }}>
					{summary && summary.pubs > 0 && (
						<span className="card-stat">
							<strong style={{ color: textColor }}>{summary.pubs}</strong>{' '}
							{summary.pubs === 1 ? 'article' : 'articles'}
						</span>
					)}
					{summary && summary.collections > 0 && (
						<span className="card-stat">
							<strong style={{ color: textColor }}>{summary.collections}</strong>{' '}
							{summary.collections === 1 ? 'issue' : 'issues'}
						</span>
					)}
				</div>
			</div>
		</a>
	);
};

const Explore = (props: Props) => {
	const { communities: allCommunities } = props.exploreData;
	const [searchTerm, setSearchTerm] = useState('');
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

	const filtered = useMemo(() => {
		if (!searchTerm.trim()) return allCommunities;
		const term = searchTerm.toLowerCase();
		return allCommunities.filter(
			(c) =>
				c.title.toLowerCase().includes(term) ||
				(c.description && c.description.toLowerCase().includes(term)) ||
				c.subdomain.toLowerCase().includes(term),
		);
	}, [allCommunities, searchTerm]);

	const visible = filtered.slice(0, visibleCount);
	const hasMore = visibleCount < filtered.length;

	return (
		<div id="explore-container">
			{/* Hero */}
			<div className="explore-hero">
				<div className="container">
					<h1>OpenScience.ph Journals</h1>
					<p className="explore-subtitle">
						An open scholarship publishing commons stewarded by OBRA Incorporated in collaboration with Philippine higher education institutions.
					</p>
				</div>
			</div>

			{/* Main content */}
			<div className="explore-main">
				<div className="container">
					<div className="explore-toolbar">
						<div className="explore-search">
							<input
								type="text"
								placeholder="Search published journals, articles, or faculty scholarship..."
								value={searchTerm}
								onChange={(e) => {
									setSearchTerm(e.target.value);
									setVisibleCount(PAGE_SIZE);
								}}
								aria-label="Search published journals, articles, or faculty scholarship..."
							/>
						</div>
						{searchTerm && (
							<span className="explore-result-count">
								{filtered.length} journal{filtered.length !== 1 ? 's' : ''}
							</span>
						)}
					</div>

					<div className="community-grid">
						{visible.map((c) => (
							<CommunityCard key={c.id} community={c} />
						))}
					</div>

					{hasMore && (
						<div className="load-more">
							<button
								className="load-more-button"
								type="button"
								onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
							>
								Show more
							</button>
						</div>
					)}

					{filtered.length === 0 && searchTerm && (
						<div className="no-results">
							<p>
								No journals match &ldquo;{searchTerm}&rdquo;. Try a different
								search.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Explore;
