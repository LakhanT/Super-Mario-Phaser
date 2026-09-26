import { Direction } from '../math.js?v=9';
import Entity from '../Entity.js?v=9';
import Pipe from '../traits/Pipe.js?v=9';
import {loadAudioBoard} from '../loaders/audio.js?v=9';

export function loadPipePortal(audioContext) {
    return Promise.all([
        loadAudioBoard('pipe-portal', audioContext),
    ])
    .then(([audio]) => {
        return createFactory(audio);
    });
}

function createFactory(audio) {

    return function createPipePortal(props) {
        const pipe = new Pipe();
        pipe.direction.copy(Direction[props.dir]);
        const entity = new Entity();
        entity.props = props;
        entity.audio = audio;
        entity.size.set(24, 30);
        entity.addTrait(pipe);
        return entity;
    };
}
