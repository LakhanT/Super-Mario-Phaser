import Entity from '../Entity.js?v=9';
import Trait from '../Trait.js?v=9';
import Killable from '../traits/Killable.js?v=9';
import PendulumMove from '../traits/PendulumMove.js?v=9';
import Physics from '../traits/Physics.js?v=9';
import Solid from '../traits/Solid.js?v=9';
import Stomper, {isStomp} from '../traits/Stomper.js?v=9';
import {hitPlayer} from '../traits/Player.js?v=9';
import {loadSpriteSheet} from '../loaders/sprite.js?v=9';

export function loadGoombaBrown() {
    return loadSpriteSheet('goomba-brown')
        .then(createGoombaFactory);
}

export function loadGoombaBlue() {
    return loadSpriteSheet('goomba-blue')
        .then(createGoombaFactory);
    }


class Behavior extends Trait {
    collides(us, them) {
        if (us.traits.get(Killable).dead) {
            return;
        }

        if (them.sliding) {
            us.traits.get(Killable).kill();
            us.traits.get(PendulumMove).speed = 0;
            us.vel.set(0, -180);
            return;
        }

        if (them.traits.has(Stomper)) {
            if (them.traits.get(Killable).dead) {
                return;
            }

            if (isStomp(them, us)) {
                us.traits.get(Killable).kill();
                us.traits.get(PendulumMove).speed = 0;
                us.vel.x = 0;
            } else {
                hitPlayer(us, them);
            }
        }
    }
}


function createGoombaFactory(sprite) {
    const walkAnim = sprite.animations.get('walk');

    function routeAnim(goomba) {
        if (goomba.traits.get(Killable).dead) {
            return 'flat';
        }

        return walkAnim(goomba.lifetime);
    }

    function drawGoomba(context) {
        sprite.draw(routeAnim(this), context, 0, 0);
    }

    return function createGoomba() {
        const goomba = new Entity();
        goomba.size.set(16, 16);

        goomba.addTrait(new Physics());
        goomba.addTrait(new Solid());
        goomba.addTrait(new PendulumMove());
        goomba.addTrait(new Behavior());
        goomba.addTrait(new Killable());

        goomba.draw = drawGoomba;

        return goomba;
    };
}
