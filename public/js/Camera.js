import {Vec2} from './math.js?v=9';

export default class Camera {
    constructor() {
        this.pos = new Vec2(0, 0);
        this.size = new Vec2(432, 224);

        this.min = new Vec2(0, 0);
        this.max = new Vec2(Infinity, Infinity);
    }
}
