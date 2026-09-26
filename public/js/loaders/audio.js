import AudioBoard from '../AudioBoard.js?v=9';
import {loadJSON} from '../loaders.js?v=9';

export function loadAudioBoard(name, audioContext) {
    const loadAudio = createAudioLoader(audioContext);
    return loadJSON(`/sounds/${name}.json`)
        .then(audioSheet => {
            const audioBoard = new AudioBoard();
            const fx = audioSheet.fx;
            return Promise.all(Object.keys(fx).map(name => {
                return loadAudio(fx[name].url)
                    .then(buffer => {
                        audioBoard.addAudio(name, buffer);
                    });
            }))
            .then(() => {
                return audioBoard;
            });
        });
}

function silentBuffer(context) {
    return context.createBuffer(1, 1, context.sampleRate || 22050);
}

function withTimeout(promise, ms, label) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Timed out loading ${label}`));
        }, ms);
        promise.then(value => {
            clearTimeout(timer);
            resolve(value);
        }, error => {
            clearTimeout(timer);
            reject(error);
        });
    });
}

export function createAudioLoader(context) {
    return function loadAudio(url) {
        const load = fetch(url)
           .then(response => {
                if (!response.ok) {
                    throw new Error(`Could not load ${url} (${response.status})`);
                }
                return response.arrayBuffer();
            })
            .then(arrayBuffer => {
                return context.decodeAudioData(arrayBuffer);
            });

        return withTimeout(load, 8000, url).catch(error => {
            console.warn(error);
            return silentBuffer(context);
        });
    }
}
