import {makeTOCHTML} from './toc';


export default {
	firestore: firebase.firestore(),
	get collection() {
		return this.firestore.collection('files');
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
			} else if (remote.updated > local.updated) {
				console.log('update with remote', file.ID);
				await store.dispatch('update', file);
			}
		});
	},

	async upload(store, db, syncedDate=null) {
		if (!syncedDate) {
			syncedDate = new Date();
		}

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
				}
			}));
		});
	},

	async sync(store, db, syncedDate=null) {
		if (!syncedDate) {
			syncedDate = new Date();
		}

		console.log('last synced', new Date(await this.getLastSynced(db)));

		await this.download(store, db, syncedDate);
		await this.upload(store, db, syncedDate);
	},
};
