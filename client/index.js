import Vue from 'vue';
import VueAnalytics from 'vue-analytics';

import store from './store.js';
import App from './App.vue';


Vue.use(VueAnalytics, {
	id: GOOGLE_ANALYTICS_ID,
	autoTracking: {
		exception: true,
	},
	debug: {
		enabled: !GOOGLE_ANALYTICS_ENABLED,
		sendHitTask: GOOGLE_ANALYTICS_ENABLED,
	},
});


const vm = new Vue({
	el: '#app',
	store: store,
	render: h => h(App),
});
