import Camera from './Camera.js?v=9';
import MusicController from './MusicController.js?v=9';
import EntityCollider from './EntityCollider.js?v=9';
import Scene from './Scene.js?v=9';
import TileCollider from './TileCollider.js?v=9';
import { clamp } from './math.js?v=9';
import { findPlayers } from './player.js?v=9';

function focusPlayer(level) {
    for (const player of findPlayers(level.entities)) {
        level.camera.pos.x = clamp(
            player.pos.x - level.camera.size.x * 0.35,
            level.camera.min.x,
            level.camera.max.x - level.camera.size.x);
    }
}

class EntityCollection extends Set {
    get(id) {
        for (const entity of this) {
            if (entity.id === id) {
                return entity;
            }
        }
    }
}

export default class Level extends Scene {
    static EVENT_TRIGGER = Symbol('trigger');
    static EVENT_COMPLETE = Symbol('complete');
    static EVENT_FINISH = Symbol('finish');
    static EVENT_PLAYER_DEAD = Symbol('player dead');

    constructor() {
        super();

        this.name = "";

        this.checkpoints = [];

        this.gravity = 1500;
        this.totalTime = 0;

        this.camera = new Camera();

        this.music = new MusicController();

        this.entities = new EntityCollection();

        this.entityCollider = new EntityCollider(this.entities);
        this.tileCollider = new TileCollider();
    }

    draw(gameContext) {
        this.comp.draw(gameContext.videoContext, this.camera);
    }

    update(gameContext) {
        this.entities.forEach(entity => {
            entity.update(gameContext, this);
        });

        this.entities.forEach(entity => {
            this.entityCollider.check(entity);
        });

        this.entities.forEach(entity => {
            entity.finalize();
        });

        focusPlayer(this);

        this.totalTime += gameContext.deltaTime;
    }

    pause() {
        this.music.pause();
    }
}
