import Trait from '../Trait.js?v=9';
import Killable from './Killable.js?v=9';

export default class Stomper extends Trait {
    static EVENT_STOMP = Symbol('stomp');

    constructor() {
        super();
        this.bounceSpeed = 400;
    }

    bounce(us, them) {
        us.bounds.bottom = them.bounds.top;
        us.vel.y = -this.bounceSpeed;
    }

    collides(us, them) {
        if (us.traits.has(Killable) && us.traits.get(Killable).dead) {
            return;
        }

        if (!them.traits.has(Killable) || them.traits.get(Killable).dead) {
            return;
        }

        if (isStomp(us, them)) {
            this.queue(() => this.bounce(us, them));
            us.sounds.add('stomp');
            us.events.emit(Stomper.EVENT_STOMP, us, them);
        }
    }
}

export function isStomp(stomper, victim) {
    return stomper.vel.y > victim.vel.y
        && stomper.bounds.bottom < victim.bounds.top + victim.size.y * 0.5;
}
