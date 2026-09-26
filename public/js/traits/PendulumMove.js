import {Sides} from '../Entity.js?v=9';
import Trait from '../Trait.js?v=9';

export default class PendulumMove extends Trait {
    constructor() {
        super();
        this.enabled = true;
        this.speed = -30;
    }

    obstruct(entity, side) {
        if (side === Sides.LEFT || side === Sides.RIGHT) {
            this.speed = -this.speed;
        }
    }

    update(entity) {
        if (this.enabled) {
            entity.vel.x = this.speed;
        }
    }
}
