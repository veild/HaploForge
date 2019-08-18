const ImgMatrix = {
	flipHorizontal(image_matrix) {
		const middle = parseInt(i_w / 2);
		for (let r = 0; r < i_h; r++) {
			for (let c = 0; c < middle; c++) {
				const temp = image_matrix[r][c];
				image_matrix[r][c] = image_matrix[r][i_w - (c + 1)];
				image_matrix[r][i_w - (c + 1)] = temp;
			}
		}
	},

	flipDiagonal(image_matrix) {
		for (let r = 0; r < i_h; r++) {
			for (let c = r; c < i_w; c++) {
				const temp = image_matrix[r][c];
				image_matrix[r][c] = image_matrix[c][r];
				image_matrix[c][r] = temp;
			}
		}
	},

	flipVertical(image_matrix) {
		for (let r = 0; r < i_h / 2; r++) {
			const temp = image_matrix[r];
			image_matrix[r] = image_matrix[i_h - (r + 1)];
			image_matrix[i_h - (r + 1)] = temp;
		}
	},

	imageToData(image_matrix, i_h, i_w, pixel_size) {
		const dlen = i_h * i_w * pixel_size, code = new Uint8Array(dlen);

		for (let r = 0; r < i_h; r++) {
			for (let c = 0; c < i_w; c++) {
				for (let j = 0; j < pixel_size; j++) {
					code[r * i_w * pixel_size + c * pixel_size + j] = image_matrix[r][c][j];
				}
			}
		}
		return code;
	},

	shiftBackward(image_matrix, n) {
		const code = imageToData(image_matrix);

		const store = new Uint8Array(n); // Store the first n
		for (var j = 0; j < n; j++) {
			store[j] = code[j];
		}
		for (var j = n; j < code.length; j++) {
			// Iterate over the remaning
			code[j - n] = code[j];
		}
		for (var j = 0; j < n; j++) {
			// Replace last n with the first
			code[dlen + j - n] = store[j];
		}

		return toImageMatrix(code);
	},

	shiftForward(
        image_matrix,
        // NEEDS WORK
        n
    ) {
		const code = imageToData(image_matrix);

		const store = new Uint8Array(n); // Store the last n
		for (var j = dlen - n; j < dlen; j++) {
			store[j - (dlen - n)] = code[j];
		}
		for (var j = dlen - (n + 1); j >= 0; j--) {
			// Iterate over the previous
			code[j + n] = code[j];
		}
		for (var j = 0; j < n; j++) {
			// Replace first n with last
			code[j] = store[j];
		}
		return toImageMatrix(code);
	}
};
