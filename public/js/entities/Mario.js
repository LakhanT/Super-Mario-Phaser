import Entity from '../Entity.js?v=9';
import Go from '../traits/Go.js?v=9';
import Jump from '../traits/Jump.js?v=9';
import Killable from '../traits/Killable.js?v=9';
import Physics from '../traits/Physics.js?v=9';
import PipeTraveller from '../traits/PipeTraveller.js?v=9';
import PoleTraveller from '../traits/PoleTraveller.js?v=9';
import Solid from '../traits/Solid.js?v=9';
import Stomper from '../traits/Stomper.js?v=9';
import Player from '../traits/Player.js?v=9';
import Trait from '../Trait.js?v=9';
import Level from '../Level.js?v=9';
import {loadAudioBoard} from '../loaders/audio.js?v=9';
import {loadSpriteSheet} from '../loaders/sprite.js?v=9';

const SLOW_DRAG = 1/1000;
const FAST_DRAG = 1/5000;

class MarioDeath extends Trait {
    constructor() {
        super();
        this.started = false;
        this.done = false;
        this.time = 0;
    }

    reset() {
        this.started = false;
        this.done = false;
        this.time = 0;
    }

    update(entity, {deltaTime}, level) {
        const killable = entity.traits.get(Killable);
        if (!killable.dead) {
            if (entity.pos.y > 320) {
                killable.kill();
            }
            return;
        }

        if (!this.started) {
            this.started = true;
            entity.vel.set(0, entity.pos.y > 240 ? 80 : -280);
            entity.traits.get(Go).dir = 0;
            level.music.pause();
            const die = new Audio('/audio/music/die.ogg');
            die.play().catch(() => {});
        }

        this.time += deltaTime;
        if (!this.done && (entity.pos.y > 360 || this.time > 2.2)) {
            this.done = true;
            level.events.emit(Level.EVENT_PLAYER_DEAD);
        }
    }
}

export function loadMario(audioContext) {
    return Promise.all([
        loadSpriteSheet('mario'),
        loadAudioBoard('mario', audioContext),
    ])
    .then(([sprite, audio]) => {
        return createMarioFactory(sprite, audio);
    });
}

function createMarioFactory(sprite, audio) {
    const runAnim = sprite.animations.get('run');
    const runLarge = sprite.animations.get('run-large');
    const climbAnim = sprite.animations.get('climb');

    function getHeading(mario) {
        const poleTraveller = mario.traits.get(PoleTraveller);
        if (poleTraveller.distance) {
            return false;
        }
        return mario.traits.get(Go).heading < 0;
    }

    function routeFrame(mario) {
        const big = mario.traits.get(Player).form !== 'small';
        if (mario.traits.get(Killable).dead) {
            return 'die';
        }

        const pipeTraveller = mario.traits.get(PipeTraveller);
        if (pipeTraveller.movement.x != 0) {
            return big ? runLarge(pipeTraveller.distance.x * 2) : runAnim(pipeTraveller.distance.x * 2);
        }
        if (pipeTraveller.movement.y != 0) {
            return big ? 'idle-large' : 'idle';
        }

        const poleTraveller = mario.traits.get(PoleTraveller);
        if (poleTraveller.distance) {
            return big ? 'idle-large' : climbAnim(poleTraveller.distance);
        }

        if (big && mario.offset.y > 0) {
            return 'crouch-large';
        }

        if (mario.traits.get(Jump).falling) {
            return big ? 'jump-large' : 'jump';
        }

        const go = mario.traits.get(Go);
        if (go.distance > 0) {
            if ((mario.vel.x > 0 && go.dir < 0) || (mario.vel.x < 0 && go.dir > 0)) {
                return big ? 'break-large' : 'break';
            }

            return big ? runLarge(go.distance) : runAnim(go.distance);
        }

        return big ? 'idle-large' : 'idle';
    }

    function setTurboState(turboOn) {
        this.traits.get(Go).dragFactor = turboOn ? FAST_DRAG : SLOW_DRAG;
    }

    const fireFrames = new Map();

    function recolorFire(source) {
        const canvas = document.createElement('canvas');
        canvas.width = source.width;
        canvas.height = source.height;
        const context = canvas.getContext('2d');
        context.drawImage(source, 0, 0);
        const image = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = image.data;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] === 121 && data[i + 1] === 123 && data[i + 2] === 0) {
                data[i] = 252;
                data[i + 1] = 252;
                data[i + 2] = 252;
            }
        }
        context.putImageData(image, 0, 0);
        return canvas;
    }

    function fireSprite(name, flip) {
        const key = `${name}:${flip ? 1 : 0}`;
        if (!fireFrames.has(key)) {
            const buffers = sprite.tiles.get(name);
            fireFrames.set(key, recolorFire(buffers[flip ? 1 : 0]));
        }
        return fireFrames.get(key);
    }

    function drawMario(context) {
        const player = this.traits.get(Player);
        if ((player.starTime > 0 || player.invincible > 0) && Math.floor(this.lifetime * 16) % 2 === 0) {
            return;
        }
        const frame = routeFrame(this);
        const flip = getHeading(this);
        if (player.form === 'fire' && frame !== 'die') {
            context.drawImage(fireSprite(frame, flip), 0, 0);
            return;
        }
        sprite.draw(frame, context, 0, 0, flip);
    }

    return function createMario() {
        const mario = new Entity();
        mario.audio = audio;
        mario.size.set(14, 16);

        mario.addTrait(new Physics());
        mario.addTrait(new Solid());
        mario.addTrait(new Go());
        mario.addTrait(new Jump());
        mario.addTrait(new Killable());
        mario.addTrait(new MarioDeath());
        mario.addTrait(new Stomper());
        mario.addTrait(new PipeTraveller());
        mario.addTrait(new PoleTraveller());

        mario.traits.get(Killable).removeAfter = Infinity;
        mario.traits.get(Jump).velocity = 175;

        mario.turbo = setTurboState;
        mario.draw = drawMario;

        mario.turbo(false);

        return mario;
    }
}
