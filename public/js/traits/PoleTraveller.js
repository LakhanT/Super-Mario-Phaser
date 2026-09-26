import { Vec2 } from '../math.js?v=9';
import Trait from '../Trait.js?v=9';

export default class PoleTraveller extends Trait {
    constructor() {
        super();
        this.distance = 0;
        this.holding = false;
        this.exiting = false;
    }
}
