import Vue from 'vue';

import store from './store.js';
import App from './App.vue';


const vm = new Vue({
	el: '#app',
	store: store,
	render: h => h(App),
});


if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('./ServiceWorker.js', { scope: '/' });
}
