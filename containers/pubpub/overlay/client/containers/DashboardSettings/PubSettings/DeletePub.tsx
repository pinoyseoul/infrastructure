import React, { Component } from 'react';

import { Button, Classes } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { InputField } from 'components';
import { getDashUrl } from 'utils/dashboard';

type Props = {
	communityData: any;
	pubData: any;
};

type State = any;

const normalizeTitle = (title: string) => {
	return title.toLowerCase().trim().replace(/\s/g, ' ');
};

class DeletePub extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			isLoading: false,
			title: '',
		};
		this.updateTitle = this.updateTitle.bind(this);
		this.handleDelete = this.handleDelete.bind(this);
	}

	updateTitle(evt) {
		this.setState({
			title: evt.target.value,
		});
	}

	handleDelete() {
		this.setState({ isLoading: true });
		return apiFetch('/api/pubs', {
			method: 'DELETE',
			body: JSON.stringify({
				pubId: this.props.pubData.id,
				communityId: this.props.communityData.id,
			}),
		})
			.then(() => {
				window.location.href = getDashUrl({ mode: 'overview' });
			})
			.catch(() => {
				this.setState({ isLoading: false });
			});
	}

	render() {
		const { pubData } = this.props;

		if (pubData.doi) {
			return (
				<div className={`${Classes.CALLOUT} ${Classes.INTENT_WARNING}`}>
					<p>
						<b>This article cannot be deleted because it has an assigned persistent identifier.</b>
					</p>
					<p>
						Articles with DOIs must be preserved for the scholarly record. If you believe
						this article should be retracted or removed, please contact us at{' '}
						<a href="mailto:admin@openscience.ph">admin@openscience.ph</a>.
					</p>
				</div>
			);
		}

		const canDelete = normalizeTitle(pubData.title) === normalizeTitle(this.state.title);

		return (
			<div className={`${Classes.CALLOUT} ${Classes.INTENT_DANGER}`}>
				<p>
					<b>Deleting an Article is permanent and cannot be undone.</b>
				</p>
				<p>
					This will permanently delete the Article <b>{pubData.title}</b>, its discussions,
					and associated metadata.
				</p>
				<p>Please type the title of the Article below to confirm your intention.</p>

				<InputField
					label={<b>Confirm Article Title</b>}
					value={this.state.title}
					onChange={this.updateTitle}
				/>

				<Button
					type="button"
					className={Classes.INTENT_DANGER}
					text="Delete Article"
					loading={this.state.isLoading}
					onClick={this.handleDelete}
					disabled={!canDelete}
				/>
			</div>
		);
	}
}
export default DeletePub;
