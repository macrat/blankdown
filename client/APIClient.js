import Vue from 'vue';
import axios from 'axios';


function remote_to_local(page) {
	return {
		id: page.id,
		name: page.name,
		markdown: page.markdown,
		readonly: page.public,
		modified: page.modified,
		accessed: page.accessed,
	};
}


export default class APIClient {
	constructor(jwt, origin=null) {
		this.jwt = jwt;
		this.origin = origin || location.origin;
		this.eventHandler = new Vue({ name: 'APIClient' });
	}

	on(eventName, callback) {
		this.eventHandler.$on(eventName, param => callback(param));
	}

	async getFiles() {
		const files = ((await axios.get(this.origin + '/v1/pages')).data.pages || []).map(remote_to_local);

		this.eventHandler.$emit('get-files', {
			jwt: this.jwt,
			files: files,
		});

		return files;
	}

	async emitChangedFiles() {
		this.eventHandler.$emit('changed-files', await this.getFiles());
	}

	async load(id) {
		if (!id) {
			this.eventHandler.$emit('load-fail', {
				jwt: this.jwt,
				id: id,
				error: 'ID was empty',
			});
			return null;
		}

		try {
			const file = remote_to_local((await axios.get(`${this.origin}/${id}.json`)).data);

			this.eventHandler.$emit('loaded', {
				jwt: this.jwt,
				file: file,
			});

			return file;
		} catch (e) {
			console.error(e);

			this.eventHandler.$emit('load-fail', {
				jwt: this.jwt,
				id: id,
				error: e,
			});

			return null;
		}
	}

	async getMarkdown(id) {
		return (await axios.get(`${this.origin}/${id}.md`)).data;
	}

	async getHTML(id) {
		return (await axios.get(`${this.origin}/${id}.html`)).data;
	}

	async loadMostRecent() {
		for (const file of (await this.getFiles() || [])) {
			const data = await this.load(file.id);
			if (data) {
				this.eventHandler.$emit('loaded-most-recent', {
					jwt: this.jwt,
					file: data,
				});

				return data;
			}
		}

		this.eventHandler.$emit('load-most-recent-fail', {
			jwt: this.jwt,
		});

		return null;
	}

	async save(file) {
		if (!file.id) {
			return;
		}

		await axios.patch(`${this.origin}/${file.id}.json`, {
			accessed: new Date().getTime() / 1000.0,
			modified: file.modified || new Date().getTime() / 1000.0,
			markdown: file.markdown,
		});

		this.eventHandler.$emit('saved', {
			jwt: this.jwt,
			file: file,
		});
		this.emitChangedFiles();
	}

	async create(markdown='') {
		const file = remote_to_local(Object.assign({
			markdown: markdown
		}, (await axios.post(this.origin + '/v1/create', {
			markdown: markdown,
		})).data));

		this.eventHandler.$emit('created', {
			jwt: this.jwt,
			file: file,
		});
		await this.emitChangedFiles();

		return file;
	}

	async remove(id) {
		await axios.delete(`${this.origin}/${id}.json`);

		this.eventHandler.$emit('removed', {
			jwt: this.jwt,
			id: id,
		});
		this.emitChangedFiles();
	}

	async markAccess(id, timestamp=null) {
		if (!timestamp) {
			timestamp = (new Date().getTime() / 1000.0);
		}

		await axios.patch(`${this.origin}/${id}.json`, {
			accessed: timestamp,
		});

		this.eventHandler.$emit('mark-access', {
			jwt: this.jwt,
			id: id,
			timestamp: timestamp,
		});
		this.emitChangedFiles();
	}
};
