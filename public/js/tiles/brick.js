import { Vec2 } from '../math.js?v=9';
import { Sides } from '../Entity.js?v=9';
import Player from "../traits/Player.js?v=9";
import {spawnCoin} from './chance.js?v=9';
import {spawnPowerup} from '../entities/Powerup.js?v=9';

function playFx(url) {
    const audio = new Audio(url);
    audio.play().catch(() => {});
}

function centerEntity(entity, pos) {
    entity.pos.x = pos.x - entity.size.x / 2;
    entity.pos.y = pos.y - entity.size.y / 2;
}

function getMatchCenter(match) {
    return new Vec2(
        match.x1 + ((match.x2 - match.x1) / 2),
        match.y1 + ((match.y2 - match.y1) / 2),
    );
}

function addShrapnel(level, gameContext, match) {
    const center = getMatchCenter(match);

    const bricks = [];
    for (let i = 0; i < 4; i++) {
        const brick = gameContext.entityFactory.brickShrapnel();
        centerEntity(brick, center);
        level.entities.add(brick);
        bricks.push(brick);
    }

    const spreadH = 60;
    const spreadV = 400;
    bricks[0].sounds.add('break');
    bricks[0].vel.set(-spreadH, -spreadV * 1.2);
    bricks[1].vel.set(-spreadH, -spreadV);
    bricks[2].vel.set(spreadH, -spreadV * 1.2);
    bricks[3].vel.set(spreadH, -spreadV);
}

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

function handleY({entity, match, resolver, gameContext, level}) {
    if (entity.vel.y > 0) {
        if (entity.bounds.bottom > match.y1) {
            entity.obstruct(Sides.BOTTOM, match);
        }
    } else if (entity.vel.y < 0 && entity.bounds.top < match.y2) {
        const player = entity.traits.get(Player);
        const item = match.tile.item;
        const ready = level.totalTime >= (match.tile.nextHit || 0);

        if (player && item && ready) {
            match.tile.nextHit = level.totalTime + 0.18;
            match.tile.bumpedAt = level.totalTime;
            if (item === 'coins10') {
                if (match.tile.coins == null) {
                    match.tile.coins = 10;
                }
                if (match.tile.coins > 0) {
                    match.tile.coins -= 1;
                    player.addCoins(1);
                    player.score += 200;
                    spawnCoin(level, match);
                    playFx('/audio/fx/brick-bump.ogg');
                    if (match.tile.coins === 0) {
                        match.tile.item = null;
                        match.tile.behavior = 'ground';
                        match.tile.style = 'chance-used';
                    }
                }
            } else {
                const prize = item === 'power'
                    ? (player.form === 'small' ? 'mushroom' : 'flower')
                    : item;
                const dir = entity.pos.x + entity.size.x / 2 < match.x1 + 8 ? 1 : -1;
                spawnPowerup(prize, level, match.x1, match.y1, dir);
                match.tile.item = null;
                match.tile.behavior = 'ground';
                match.tile.style = 'chance-used';
            }
        } else if (player && !item && player.form !== 'small') {
            const grid = resolver.matrix;
            grid.delete(match.indexX, match.indexY);
            addShrapnel(level, gameContext, match);
        } else if (player && !item && ready) {
            match.tile.nextHit = level.totalTime + 0.18;
            match.tile.bumpedAt = level.totalTime;
            playFx('/audio/fx/brick-bump.ogg');
        }

        if (entity.bounds.top < match.y2) {
            entity.obstruct(Sides.TOP, match);
        }
    }
}

export const brick = [handleX, handleY];
