import Trait from '../Trait.js?v=9';

export default class Trigger extends Trait {
    constructor() {
        super();
        this.touches = new Set();
        this.conditions = [];
    }

    collides(_, them) {
        this.touches.add(them);
    }

    update(entity, gameContext, level) {
        if (this.touches.size > 0) {
            for (const condition of this.conditions) {
                condition(entity, this.touches, gameContext, level);
            }
            this.touches.clear();
        }
    }
}
