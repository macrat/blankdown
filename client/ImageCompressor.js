export default class ImageCompressor {
	constructor(maxSize=640) {
		this.canvas = document.createElement('canvas');
		this.context = this.canvas.getContext('2d');
		this.maxSize = maxSize;
	}

	compress(url) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.src = url;

			img.addEventListener('load', () => {
				if (img.naturalWidth > img.naturalHeight) {
					this.canvas.width = Math.min(this.maxSize, img.naturalWidth);
					this.canvas.height = this.canvas.width * img.naturalHeight / img.naturalWidth;
				} else {
					this.canvas.height = Math.min(this.maxSize, img.naturalHeight);
					this.canvas.width = this.canvas.height * img.naturalWidth / img.naturalHeight;
				}

				this.context.fillStyle = 'white';
				this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
				this.context.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);

				const jpeg = this.canvas.toDataURL('image/jpeg', 0.8);
				const png = this.canvas.toDataURL('image/png');

				if (url.length <= jpeg.length && url.length <= png.length) {
					resolve(url);
				} else if (png && (!jpeg || png.length <= jpeg.length)) {
					resolve(png);
				} else {
					resolve(jpeg);
				}
			});

			img.addEventListener('error', err => {
				reject(err);
			});
		});
	}
}
