import Trait from '../Trait.js?v=9';

export default class Gravity extends Trait {
    update(entity, {deltaTime}, level) {
        entity.vel.y += level.gravity * deltaTime;
    }
}
