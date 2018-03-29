import Vue from 'vue';
import {makeTOCHTML} from './toc';


export default {
	firestore: firebase.firestore(),
	get collection() {
		return this.firestore.collection('files');
	},
	get $ga() {
		return Vue.prototype.$ga;
	},

	async getLastSynced(db) {
		return ((await db.sort('synced', 0, 1))[0] || {synced: 0}).synced;
	},

	async download(store, db, syncedDate=null) {
		if (!syncedDate) {
			syncedDate = new Date();
		}

		const query = await this.collection
			.where('uid', '==', store.state.user.uid)
			.where('updated', '>', await this.getLastSynced(db))
			.get();

		let count = 0;

		query.forEach(async doc => {
			const remote = doc.data();
			console.log(`check remote ${remote.id} (updated at ${remote.updated})`);
			const local = await db.get(remote.id);

			const file = {
				ID: remote.id,
				markdown: remote.markdown,
				toc: makeTOCHTML(remote.markdown),
				updated: remote.updated,
				synced: syncedDate,
				saved: false,
			};

			if (!local) {
				console.log('get by remote', file.ID);

				await store.dispatch('appendFile', file);

				count++;
				this.$ga.event('sync', 'get', 'batch sync', {nonInteraction: true});
			} else if (remote.updated > local.updated) {
				console.log('update with remote', file.ID);

				await store.dispatch('update', file);

				count++;
				this.$ga.event('sync', 'get', 'batch sync', {nonInteraction: true});
			}
		});

		return count;
	},

	async upload(store, db, syncedDate=null) {
		if (!syncedDate) {
			syncedDate = new Date();
		}

		let count = 0;

		await db.greater('updated', await this.getLastSynced(db)).then(localUpdatets => {
			return Promise.all(localUpdatets.map(async local => {
				console.log(`check local ${local.ID} (updated at ${new Date(local.updated)})`);

				let needToUpdate = false;
				try {
					const doc = await this.collection.doc(local.ID).get();
					needToUpdate = doc.exists && local.updated >= doc.data().updated;
				} catch(err) {
					needToUpdate = true;
				}

				if (needToUpdate) {
					console.log('put to remote', local.ID);

					await this.collection.doc(local.ID).set({
						uid: store.state.user.uid,
						id: local.ID,
						markdown: local.markdown,
						updated: new Date(local.updated),
					});

					await store.dispatch('save', {
						ID: local.ID,
						markdown: local.markdown,
						toc: makeTOCHTML(local.markdown),
						updated: new Date(local.updated),
						synced: syncedDate,
						saved: false,
					});

					count++;
					this.$ga.event('sync', 'put', 'batch sync', {nonInteraction: true});
				}
			}));
		});

		return count;
	},

	async sync(store, db, syncedDate=null) {
		if (!syncedDate) {
			syncedDate = new Date();
		}

		console.log('last synced', new Date(await this.getLastSynced(db)));

		const downloaded = await this.download(store, db, syncedDate);
		const uploaded = await this.upload(store, db, syncedDate);

		this.$ga.event('sync', 'downloaded count', 'batch sync', downloaded, {nonInteraction: true});
		this.$ga.event('sync', 'uploaded count', 'batch sync', uploaded, {nonInteraction: true});
	},
};
