import Trait from '../Trait.js?v=9';
import Stomper from '../traits/Stomper.js?v=9';
import Killable from './Killable.js?v=9';
import {spawnFireball} from '../entities/Powerup.js?v=9';

const COIN_LIFE_THRESHOLD = 100;

export function hitPlayer(enemy, mario) {
    const player = mario.traits.get(Player);
    const killable = mario.traits.get(Killable);
    if (!player || !killable || killable.dead) {
        return;
    }
    if (player.starTime > 0) {
        const enemyLife = enemy.traits.get(Killable);
        if (enemyLife && !enemyLife.dead) {
            enemyLife.kill();
            player.score += 100;
        }
        return;
    }
    if (player.invincible > 0) {
        return;
    }
    if (player.form !== 'small') {
        player.shrink(mario);
        return;
    }
    killable.kill();
}

export default class Player extends Trait {
    constructor() {
        super();
        this.name = "UNNAMED";
        this.world = "UNKNOWN";
        this.coins = 0;
        this.lives = 3;
        this.score = 0;
        this.form = 'small';
        this.starTime = 0;
        this.invincible = 0;
        this.fireCooldown = 0;
        this.wantsFire = false;
        this.keyCrouch = false;
        this.padCrouch = false;
        this.pendingStar = false;
        this.starAudio = null;

        this.listen(Stomper.EVENT_STOMP, () => {
            this.score += 100;
        });
    }

    update(entity, {deltaTime}, level) {
        if (this.invincible > 0) {
            this.invincible -= deltaTime;
        }
        if (this.fireCooldown > 0) {
            this.fireCooldown -= deltaTime;
        }
        if (this.pendingStar) {
            this.pendingStar = false;
            if (level.music) {
                level.music.pause();
            }
            this.starAudio = new Audio('/audio/music/starman.ogg');
            this.starAudio.loop = true;
            this.starAudio.play().catch(() => {});
        }
        if (this.starTime > 0) {
            this.starTime -= deltaTime;
            if (this.starTime <= 0) {
                this.stopStar(level, true);
            }
        }
        if (this.wantsFire) {
            this.wantsFire = false;
            if (this.form === 'fire' && this.fireCooldown <= 0) {
                this.fireCooldown = 0.35;
                spawnFireball(entity, level);
            }
        }
        this.applyBody(entity);
    }

    stopStar(level, resume) {
        if (this.starAudio) {
            this.starAudio.pause();
            this.starAudio = null;
        }
        this.pendingStar = false;
        this.starTime = 0;
        if (resume && level && level.music) {
            level.music.playTheme();
        }
    }

    applyBody(entity) {
        let falling = false;
        let travelling = false;
        for (const trait of entity.traits.values()) {
            if (trait.engageTime !== undefined && trait.falling !== undefined) {
                falling = trait.falling;
            }
            if (trait.movement && (trait.movement.x || trait.movement.y)) {
                travelling = true;
            }
            if (trait.holding) {
                travelling = true;
            }
        }

        if (this.form === 'small') {
            entity.size.set(14, 16);
            entity.offset.set(0, 0);
            return;
        }

        const crouch = (this.keyCrouch || this.padCrouch) && !falling && !travelling;
        const bottom = entity.bounds.bottom;
        entity.offset.set(0, crouch ? 16 : 0);
        entity.size.set(14, crouch ? 16 : 32);
        entity.bounds.bottom = bottom;
    }

    receiveItem(kind, entity) {
        const fx = new Audio(kind === '1up' ? '/audio/fx/1up.ogg' : '/audio/fx/power-up-consume.ogg');
        fx.play().catch(() => {});
        if (kind === '1up') {
            this.addLives(1);
            if (this.form === 'small') {
                this.grow(entity);
            }
            return;
        }
        this.score += 1000;
        if (kind === 'star') {
            this.starTime = 10;
            this.pendingStar = true;
            return;
        }
        if (kind === 'mushroom') {
            if (this.form === 'small') {
                this.grow(entity);
            }
            return;
        }
        if (kind === 'flower') {
            if (this.form === 'small') {
                this.grow(entity);
            }
            this.form = 'fire';
            this.applyBody(entity);
        }
    }

    grow(entity) {
        if (this.form !== 'small') {
            return;
        }
        this.form = 'big';
        const bottom = entity.bounds.bottom;
        entity.offset.set(0, 0);
        entity.size.set(14, 32);
        entity.bounds.bottom = bottom;
    }

    shrink(entity) {
        this.form = 'small';
        this.invincible = 2;
        this.keyCrouch = false;
        this.padCrouch = false;
        const bottom = entity.bounds.bottom;
        entity.offset.set(0, 0);
        entity.size.set(14, 16);
        entity.bounds.bottom = bottom;
        entity.sounds.add('jump');
    }

    addCoins(count) {
        this.coins += count;
        this.queue(entity => entity.sounds.add('coin'));
        while (this.coins >= COIN_LIFE_THRESHOLD) {
            this.addLives(1);
            this.coins -= COIN_LIFE_THRESHOLD;
        }
    }

    addLives(count) {
        this.lives += count;
    }
}
