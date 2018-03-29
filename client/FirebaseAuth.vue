<style scoped>
span {
	display: block;
}
.email {
	color: #aaa;
	font-size: 90%;
	padding-bottom: .3em;
}

.loading {
	color: #a0a0a0;
}
</style>


<template>
	<li @click=login v-if="$store.state.user === null">Sign in with Google</li>
	<li @click=logout v-else-if="$store.state.user !== undefined"><span class=email>{{ $store.state.user.email }}</span><span>Sign out</span></li>
	<li v-else class=loading>loading...</li>
</template>

<script>
export default {
	mounted() {
		firebase.auth().onAuthStateChanged(user => {
			if (user) {
				this.$store.dispatch('loggedIn', user);
				this.$ga.event('account', 'signin done', {nonInteraction: true});
			} else {
				this.$store.dispatch('loggedOut');
				this.$ga.event('account', 'signout done', {nonInteraction: true});
			}
		}, err => console.error(err));
	},
	methods: {
		login() {
			this.$ga.event('account', 'signin request');

			firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
				.then(() => firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider()))
				.catch(err => console.error(err));
		},
		logout() {
			this.$ga.event('account', 'signout request');

			firebase.auth().signOut();
		},
	},
};
</script>
