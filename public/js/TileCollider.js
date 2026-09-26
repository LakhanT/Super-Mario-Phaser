import TileResolver from './TileResolver.js?v=9';
import {brick} from './tiles/brick.js?v=9';
import {chance} from './tiles/chance.js?v=9';
import {coin} from './tiles/coin.js?v=9';
import {ground} from './tiles/ground.js?v=9';

const handlers = {
    brick,
    chance,
    coin,
    ground,
}

export default class TileCollider {
    constructor() {
        this.resolvers = [];
    }

    addGrid(tileMatrix) {
        this.resolvers.push(new TileResolver(tileMatrix));
    }

    checkX(entity, gameContext, level) {
        let x;
        if (entity.vel.x > 0) {
            x = entity.bounds.right;
        } else if (entity.vel.x < 0) {
            x = entity.bounds.left;
        } else {
            return;
        }

        for (const resolver of this.resolvers) {
            const matches = resolver.searchByRange(
                x, x,
                entity.bounds.top, entity.bounds.bottom);

            matches.forEach(match => {
                this.handle(0, entity, match, resolver, gameContext, level);
            });
        }
    }

    checkY(entity, gameContext, level) {
        let y;
        if (entity.vel.y > 0) {
            y = entity.bounds.bottom;
        } else if (entity.vel.y < 0) {
            y = entity.bounds.top;
        } else {
            return;
        }

        for (const resolver of this.resolvers) {
            const matches = resolver.searchByRange(
                entity.bounds.left, entity.bounds.right,
                y, y);

            matches.forEach(match => {
                this.handle(1, entity, match, resolver, gameContext, level);
            });
        }
    }

    handle(index, entity, match, resolver, gameContext, level) {
        const tileCollisionContext = {
            entity,
            match,
            resolver,
            gameContext,
            level,
        };

        const handler = handlers[match.tile.behavior];
        if (handler) {
            handler[index](tileCollisionContext);
        }
    }
}
