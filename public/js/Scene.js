import Compositor from './Compositor.js?v=9';
import EventEmitter from './EventEmitter.js?v=9';

export default class Scene {
    static EVENT_COMPLETE = Symbol('scene complete');

    constructor() {
        this.events = new EventEmitter();
        this.comp = new Compositor();
    }

    draw(gameContext) {
        this.comp.draw(gameContext.videoContext);
    }

    update(gameContext) {
    }

    pause() {
        console.log("Pause", this);
    }
}
