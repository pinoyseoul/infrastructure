import type { Callback, Community } from 'types';

import React, { useCallback } from 'react';

import { Switch } from '@blueprintjs/core';

import { CollectionMultiSelect, InputField, SettingsSection } from 'components';

type Props = {
	communityData: Community;
	updateCommunityData: Callback<Partial<Community>>;
};

const createPub = <>"Create Article"</>;

const PublicNewPubs = (props: Props) => {
	const { communityData, updateCommunityData } = props;
	const { hideCreatePubButton, defaultPubCollections } = communityData;

	const handleAddDefaultCollection = useCallback(
		(collectionId: string) => {
			const existingCollectionIds = defaultPubCollections || [];
			const newCollectionIds = [...existingCollectionIds, collectionId];
			updateCommunityData({ defaultPubCollections: newCollectionIds });
		},
		[updateCommunityData, defaultPubCollections],
	);

	const handleRemoveDefaultCollection = useCallback(
		(evt: Event, collectionIndex: number) => {
			const existingCollectionIds = defaultPubCollections || [];
			const newCollectionIds = existingCollectionIds.filter((item, filterIndex) => {
				return filterIndex !== collectionIndex;
			});
			updateCommunityData({ defaultPubCollections: newCollectionIds });
		},
		[updateCommunityData, defaultPubCollections],
	);

	return (
		<SettingsSection
			title="Article creation by visitors"
			description={
				<>
					You can enable the {createPub} button in the header for all visitors to your
					Journal. These Articles can be released to the public after undergoing review by
					Journal members.
				</>
			}
		>
			<InputField
				helperText={
					<>
						The button will always be available to Journal members with permission to
						create Articles.
					</>
				}
			>
				<Switch
					large
					labelElement={<>Show {createPub} button for all users</>}
					checked={!hideCreatePubButton}
					onChange={(evt) => {
						updateCommunityData({ hideCreatePubButton: !(evt.target as any).checked });
					}}
				/>
			</InputField>
			<InputField
				label={<>Default {createPub} Issues</>}
				isDisabled={hideCreatePubButton}
				helperText={
					<>Keep track of Articles created this way by adding them to an Issue.</>
				}
			>
				<CollectionMultiSelect
					allCollections={communityData.collections as any}
					selectedCollectionIds={defaultPubCollections || []}
					onItemSelect={handleAddDefaultCollection}
					onRemove={handleRemoveDefaultCollection}
					placeholder="Select Issues..."
				/>
			</InputField>
		</SettingsSection>
	);
};

export default PublicNewPubs;
