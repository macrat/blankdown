import { EventEmitter } from 'events';

import Auth0Lock from 'auth0-lock';
import jwtDecode from 'jwt-decode';


export default class Auth {
	constructor(clientID, domain) {
		this.clientID = clientID;
		this.domain = domain;

		this.lock = new Auth0Lock(clientID, domain, {
			auth: {
				responseType: 'token id_token',
				scope: 'openid profile',
				redirectUrl: location.origin,
				sso: true,
			},
			theme: {
				logo: '/icon.svg',
				primaryColor: 'lightslategray',
				icon: '/icon.svg',
			},
			languageDictionary: {
				title: 'blankdown',
			},
		});

		this.event = new EventEmitter();

		this.lock.on('authenticated', result => {
			this.hideUI();

			this.token = {
				jwt: result.idToken,
				access: result.accessToken,
			};

			const jwt = this.jwt;
			if (jwt) {
				this.event.emit('login', jwt);
			} else {
				this.event.emit('error', 'failed to parse token');
			}
		});

		this.lock.on('authorization_error', error => {
			this.token = null;

			this.event.emit('error', error);
		});
	}

	on(name, func) {
		this.event.addListener(name, func);
	}

	off(name, func) {
		this.event.removeListener(name, func);
	}

	set token(val) {
		if (val) {
			localStorage.setItem('auth0-token', JSON.stringify({
				access: val.access,
				jwt: val.jwt,
			}));
		} else {
			localStorage.removeItem('auth0-token');
		}
	}

	get token() {
		const token = JSON.parse(localStorage.getItem('auth0-token'))
		if (!token || !token.jwt || !token.access) {
			return null;
		}

		try {
			if (new Date() < new Date(jwtDecode(token.jwt).exp * 1000.0)) {
				return token;
			} else {
				this.token = null;
				return null;
			}
		} catch (e) {
			this.token = null;
			return null;
		}
	}

	get accessToken() {
		const token = this.token;
		if (token) {
			return token.access;
		} else {
			return null;
		}
	}

	get jwt() {
		const token = this.token;
		if (token) {
			return token.jwt;
		} else {
			return null;
		}
	}

	get profile() {
		const jwt = this.jwt;
		if (jwt) {
			return jwtDecode(this.jwt);
		} else {
			return null;
		}
	}

	checkLoggedIn() {
		const jwt = this.jwt;
		if (jwt) {
			this.event.emit('login', jwt);
		}
	}

	login() {
		const jwt = this.jwt;
		if (jwt) {
			this.event.emit('login', jwt);
		} else {
			this.lock.show();
		}
	}

	logout() {
		this.token = null;
		this.lock.logout({ clientID: this.clientID, returnTo: location.origin + '/' });
	}

	hideUI() {
		this.lock.hide();
	}
}
