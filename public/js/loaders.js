export function loadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => {
            resolve(image);
        });
        image.addEventListener('error', () => {
            reject(new Error(`Could not load image ${url}`));
        });
        image.src = url;
    });
}

export function loadJSON(url) {
    return fetch(url)
    .then(response => {
        if (!response.ok) {
            throw new Error(`Could not load ${url} (${response.status})`);
        }
        return response.json();
    });
}
