import {Sides} from '../Entity.js?v=9';
import Trait from '../Trait.js?v=9';
import Killable from './Killable.js?v=9';
import PoleTraveller from './PoleTraveller.js?v=9';

export default class Jump extends Trait {
    constructor() {
        super();

        this.ready = 0;
        this.duration = 0.3;
        this.engageTime = 0;
        this.requestTime = 0;
        this.gracePeriod = 0.1;
        this.speedBoost = 0.3;
        this.velocity = 200;
    }

    get falling() {
        return this.ready < 0;
    }

    start() {
        this.requestTime = this.gracePeriod;
    }

    cancel() {
        this.engageTime = 0;
        this.requestTime = 0;
    }

    obstruct(entity, side) {
        if (side === Sides.BOTTOM) {
            this.ready = 1;
        } else if (side === Sides.TOP) {
            this.cancel();
        }
    }

    update(entity, {deltaTime}, level) {
        const killable = entity.traits.get(Killable);
        const pole = entity.traits.get(PoleTraveller);
        if ((killable && killable.dead) || (pole && (pole.holding || pole.exiting))) {
            this.requestTime = 0;
            this.engageTime = 0;
            return;
        }

        if (this.requestTime > 0) {
            if (this.ready > 0) {
                entity.sounds.add('jump');
                this.engageTime = this.duration;
                this.requestTime = 0;
            }

            this.requestTime -= deltaTime;
        }

        if (this.engageTime > 0) {
            entity.vel.y = -(this.velocity + Math.abs(entity.vel.x) * this.speedBoost);
            this.engageTime -= deltaTime;
        }

        this.ready--;
    }
}
