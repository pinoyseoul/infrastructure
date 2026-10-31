import type { Collection, Pub } from 'types';

import React, { useMemo, useState } from 'react';

import { NonIdealState } from '@blueprintjs/core';

import { useInfiniteScroll } from 'client/utils/useInfiniteScroll';
import { useManyPubs } from 'client/utils/useManyPubs';
import { fuzzyMatchCollection } from 'utils/fuzzyMatch';

import { KindToggle, OverviewSearchGroup, type PubsOverviewSearchFilter } from '../helpers';
import {
	ExpandableCollectionOverviewRow,
	LoadMorePubsRow,
	OverviewRows,
	PubOverviewRow,
	SpecialRow,
} from '../overviewRows';

import './communityItems.scss';

type Props = {
	collections: Collection[];
	initialPubs: Pub[];
	initiallyLoadedAllPubs: boolean;
};

const getSearchPlaceholderText = (showCollections: boolean, showPubs: boolean) => {
	if (showCollections && showPubs) {
		return 'Search Issues and Articles';
	}
	if (showCollections) {
		return 'Search Issues';
	}
	return 'Search Articles';
};

const CommunityItems = (props: Props) => {
	const { collections: allCollections, initialPubs, initiallyLoadedAllPubs } = props;
	const [searchTerm, setSearchTerm] = useState('');
	const [filter, setFilter] = useState<null | PubsOverviewSearchFilter>(null);
	const [showPubs, setShowPubs] = useState(true);
	const [showCollections, setShowCollections] = useState(true);
	const query = filter?.query;
	const isSearchingOrFiltering = !!query || !!searchTerm;

	const collections = useMemo(
		() => allCollections.filter((collection) => fuzzyMatchCollection(collection, searchTerm)),
		[allCollections, searchTerm],
	);

	const {
		currentQuery: { pubs, hasLoadedAllPubs, loadMorePubs },
	} = useManyPubs({
		isEager: isSearchingOrFiltering,
		initialPubs,
		initiallyLoadedAllPubs,
		batchSize: 200,
		query: {
			term: searchTerm,
			ordering: { field: 'title', direction: 'ASC' },
			...filter?.query,
		},
	});

	const canShowCollections = !query;
	const canLoadMorePubs = !hasLoadedAllPubs && showPubs;

	useInfiniteScroll({
		enabled: canLoadMorePubs,
		useDocumentElement: true,
		onRequestMoreItems: loadMorePubs,
	});

	const renderCollections = () => {
		return collections.map((collection) => (
			<ExpandableCollectionOverviewRow collection={collection} key={collection.id} />
		));
	};

	const renderPubs = () => {
		return pubs.map((pub) => <PubOverviewRow pub={pub} key={pub.id} />);
	};

	const renderEmptyState = () => {
		if (collections.length === 0) {
			if (initialPubs.length === 0) {
				return (
					<NonIdealState
						icon="clean"
						title="This Journal looks brand new!"
						description="Try creating an Article or Issue from above."
					/>
				);
			}
			if (pubs.length === 0 && hasLoadedAllPubs && isSearchingOrFiltering) {
				return <SpecialRow>No matching Articles or Issues.</SpecialRow>;
			}
		}
		return null;
	};

	return (
		<div className="community-items-component">
			<OverviewSearchGroup
				placeholder={getSearchPlaceholderText(showCollections, showPubs)}
				onUpdateSearchTerm={(t) => t === '' && setSearchTerm(t)}
				onCommitSearchTerm={setSearchTerm}
				onChooseFilter={setFilter}
				rightControls={
					<>
						{canShowCollections && (
							<KindToggle
								selected={showCollections}
								onSelect={() => {
									setShowCollections(!showCollections);
									if (showCollections && !showPubs) {
										setShowPubs(true);
									}
								}}
								icon="collection"
								label="Issues"
								count={collections.length}
							/>
						)}
						<KindToggle
							selected={showPubs || !canShowCollections}
							onSelect={() => {
								setShowPubs(!showPubs);
								if (showPubs && !showCollections) {
									setShowCollections(true);
								}
							}}
							icon="pubDoc"
							label="Articles"
							count={hasLoadedAllPubs ? pubs.length : `${pubs.length}+`}
							disabled={!canShowCollections}
						/>
					</>
				}
			/>
			<OverviewRows>
				{showCollections && canShowCollections && renderCollections()}
				{showPubs && renderPubs()}
				{canLoadMorePubs && <LoadMorePubsRow isLoading />}
				{renderEmptyState()}
			</OverviewRows>
		</div>
	);
};

export default CommunityItems;
