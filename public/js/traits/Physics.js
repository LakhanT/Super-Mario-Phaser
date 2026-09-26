import Trait from '../Trait.js?v=9';
import Killable from './Killable.js?v=9';
import PoleTraveller from './PoleTraveller.js?v=9';

export default class Physics extends Trait {
    update(entity, gameContext, level) {
        const pole = entity.traits.get(PoleTraveller);
        if (pole && pole.holding) {
            entity.vel.set(0, 0);
            return;
        }

        const {deltaTime} = gameContext;
        const dead = entity.traits.has(Killable) && entity.traits.get(Killable).dead;

        entity.pos.x += entity.vel.x * deltaTime;
        if (!dead) {
            level.tileCollider.checkX(entity, gameContext, level);
        }

        entity.pos.y += entity.vel.y * deltaTime;
        if (!dead) {
            level.tileCollider.checkY(entity, gameContext, level);
        }

        entity.vel.y += level.gravity * deltaTime;
    }
}
