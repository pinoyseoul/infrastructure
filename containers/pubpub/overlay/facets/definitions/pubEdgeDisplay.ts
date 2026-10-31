import { boolean, facet, prop } from '../core';

export const PubEdgeDisplay = facet({
	name: 'PubEdgeDisplay',
	label: 'Article Connections settings',
	props: {
		defaultsToCarousel: prop(boolean, {
			rootValue: true,
			label: 'Appearance in Article',
		}),
		descriptionIsVisible: prop(boolean, {
			rootValue: true,
			label: 'Show Connection descriptions',
		}),
	},
});
