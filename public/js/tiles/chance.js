import Entity from '../Entity.js?v=9';
import {Sides} from '../Entity.js?v=9';
import Player from '../traits/Player.js?v=9';
import LifeLimit from '../traits/LifeLimit.js?v=9';
import Velocity from '../traits/Velocity.js?v=9';
import {spawnPowerup} from '../entities/Powerup.js?v=9';

function handleX({entity, match}) {
    if (entity.vel.x > 0) {
        if (entity.bounds.right > match.x1) {
            entity.obstruct(Sides.RIGHT, match);
        }
    } else if (entity.vel.x < 0) {
        if (entity.bounds.left < match.x2) {
            entity.obstruct(Sides.LEFT, match);
        }
    }
}

export function spawnCoin(level, match) {
    if (!level.sprites || !level.sprites.animations.has('coin')) {
        return;
    }

    const coin = new Entity();
    coin.pos.set(match.x1, match.y1);
    coin.vel.set(0, -90);
    coin.size.set(16, 16);

    const life = new LifeLimit();
    life.time = 0.4;
    coin.addTrait(life);
    coin.addTrait(new Velocity());

    const sprites = level.sprites;
    coin.draw = function drawCoin(context) {
        sprites.drawAnim('coin', context, 0, 0, this.lifetime);
    };

    level.entities.add(coin);
}

function handleY({entity, match, level}) {
    if (entity.vel.y > 0) {
        if (entity.bounds.bottom > match.y1) {
            entity.obstruct(Sides.BOTTOM, match);
        }
        return;
    }

    if (entity.vel.y < 0 && entity.bounds.top < match.y2) {
        entity.obstruct(Sides.TOP, match);

        const player = entity.traits.get(Player);
        if (!player || match.tile.behavior !== 'chance') {
            return;
        }

        let prize = match.tile.item || 'coin';
        if (prize === 'power') {
            prize = player.form === 'small' ? 'mushroom' : 'flower';
        }
        match.tile.behavior = 'ground';
        match.tile.style = 'chance-used';
        match.tile.bumpedAt = level.totalTime;
        match.tile.item = null;
        if (prize === 'coin') {
            player.addCoins(1);
            player.score += 200;
            spawnCoin(level, match);
        } else {
            const dir = entity.pos.x + entity.size.x / 2 < match.x1 + 8 ? 1 : -1;
            spawnPowerup(prize, level, match.x1, match.y1, dir);
        }
    }
}

export const chance = [handleX, handleY];
