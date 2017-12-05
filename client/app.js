import Vue from 'vue';

import store from './store.mjs';
import App from './App.vue';


const vm = new Vue({
	el: '#app',
	store: store,
	render: h => h(App),
});
