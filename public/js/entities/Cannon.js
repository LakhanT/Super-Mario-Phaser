import Entity from '../Entity.js?v=9';
import Emitter from '../traits/Emitter.js?v=9';
import {findPlayers} from '../player.js?v=9';
import {loadAudioBoard} from '../loaders/audio.js?v=9';

const HOLD_FIRE_THRESHOLD = 30;

export function loadCannon(audioContext) {
    return loadAudioBoard('cannon', audioContext)
    .then(audio => {
        return createCannonFactory(audio);
    });
}

function createCannonFactory(audio) {

    function emitBullet(cannon, gameContext, level) {
        let dir = 1;
        for (const player of findPlayers(level.entities)) {
            if (player.pos.x > cannon.pos.x - HOLD_FIRE_THRESHOLD
            && player.pos.x < cannon.pos.x + HOLD_FIRE_THRESHOLD) {
                return;
            }

            if (player.pos.x < cannon.pos.x) {
                dir = -1;
            }
        }

        const bullet = gameContext.entityFactory.bullet();

        bullet.pos.copy(cannon.pos);
        bullet.vel.set(80 * dir, 0);

        cannon.sounds.add('shoot');
        level.entities.add(bullet);
    }

    return function createCannon() {
        const cannon = new Entity();
        cannon.audio = audio;

        const emitter = new Emitter();
        emitter.interval = 4;
        emitter.emitters.push(emitBullet);
        cannon.addTrait(emitter);
        return cannon;
    }
}
