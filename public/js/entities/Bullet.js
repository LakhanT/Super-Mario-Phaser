import Entity from '../Entity.js?v=9';
import Trait from '../Trait.js?v=9';
import Killable from '../traits/Killable.js?v=9';
import Gravity from '../traits/Gravity.js?v=9';
import Stomper, {isStomp} from '../traits/Stomper.js?v=9';
import {hitPlayer} from '../traits/Player.js?v=9';
import Velocity from '../traits/Velocity.js?v=9';
import {loadSpriteSheet} from '../loaders/sprite.js?v=9';

export function loadBullet() {
    return loadSpriteSheet('bullet')
    .then(createBulletFactory);
}


class Behavior extends Trait {
    constructor() {
        super();
        this.gravity = new Gravity();
    }

    collides(us, them) {
        if (us.traits.get(Killable).dead) {
            return;
        }

        if (them.traits.has(Stomper)) {
            if (isStomp(them, us)) {
                us.traits.get(Killable).kill();
                us.vel.set(100, -200);
            } else {
                hitPlayer(us, them);
            }
        }
    }

    update(entity, gameContext, level) {
        if (entity.traits.get(Killable).dead) {
            this.gravity.update(entity, gameContext, level);
        }
    }
}


function createBulletFactory(sprite) {
    function drawBullet(context) {
        sprite.draw('bullet', context, 0, 0, this.vel.x > 0);
    }

    return function createBullet() {
        const bullet = new Entity();
        bullet.size.set(16, 14);

        bullet.addTrait(new Velocity());
        bullet.addTrait(new Behavior());
        bullet.addTrait(new Killable());

        bullet.draw = drawBullet;

        return bullet;
    };
}
