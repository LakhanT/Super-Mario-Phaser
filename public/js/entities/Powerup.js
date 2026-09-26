import Entity from '../Entity.js?v=9';
import Trait from '../Trait.js?v=9';
import Solid from '../traits/Solid.js?v=9';
import Killable from '../traits/Killable.js?v=9';
import Go from '../traits/Go.js?v=9';

const PALETTE = {
    r: [228, 36, 28],
    w: [252, 252, 252],
    s: [252, 188, 116],
    k: [0, 0, 0],
    g: [0, 168, 0],
    y: [252, 216, 0],
    o: [252, 152, 56],
    e: [252, 60, 0],
};

const ART = {
    mushroom: [
        '.....rrrrrr.....',
        '...rrwwrrwwrr...',
        '..rrwwrrrrwwrr..',
        '.rrrrrrrrrrrrrr.',
        '.rrrrrrrrrrrrrr.',
        'rrrrrrrrrrrrrrrr',
        'rrrrrrrrrrrrrrrr',
        '.ssssssssssssss.',
        '..sskksskkssss..',
        '..sskksskkssss..',
        '...ssssssssss...',
        '....ssssssss....',
        '.....ssssss.....',
        '......ssss......',
        '................',
        '................',
    ],
    flower: [
        '....yyyyyyyy....',
        '...yywwyywwyy...',
        '..yywwyyyywwyy..',
        '.yyyyyyyyyyyyyy.',
        '.yyrrrrrrrrrryy.',
        'yyrrwwrrrrwwrryy',
        'yyrrwwrrrrwwrryy',
        '.yyrrrrrrrrrryy.',
        '..yyygggggyyy...',
        '...yygggggyy....',
        '....gggggggg....',
        '....gggggggg....',
        '.....gggggg.....',
        '.....gggggg.....',
        '......gggg......',
        '................',
    ],
    star: [
        '.......yy.......',
        '......yyyy......',
        '.....yyyyyy.....',
        'yyyyyyyyyyyyyyyy',
        '.yyyyyyyyyyyyyy.',
        '..yyyyyyyyyyyy..',
        '...yyyyyyyyyy...',
        '...yyyyyyyyyy...',
        '..yyyyyyyyyyyy..',
        '.yyyyy....yyyyy.',
        'yyyy........yyyy',
        'yy..........yy..',
        '................',
        '................',
        '................',
        '................',
    ],
    '1up': [
        '.....gggggg.....',
        '...ggwwggwwgg...',
        '..ggwwggggwwgg..',
        '.gggggggggggggg.',
        '.gggggggggggggg.',
        'gggggggggggggggg',
        'gggggggggggggggg',
        '.ssssssssssssss.',
        '..sskksskkssss..',
        '..sskksskkssss..',
        '...ssssssssss...',
        '....ssssssss....',
        '.....ssssss.....',
        '......ssss......',
        '................',
        '................',
    ],
    fire: [
        '..eeee..',
        '.eeeeee.',
        'eeeeeeee',
        'eeyyyeee',
        'eeyyyyee',
        '.eeyyee.',
        '..eeee..',
        '...ee...',
    ],
};

function paint(rows) {
    const height = rows.length;
    const width = rows[0].length;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    const image = context.createImageData(width, height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const color = PALETTE[rows[y][x]];
            if (!color) {
                continue;
            }
            const index = (y * width + x) * 4;
            image.data[index] = color[0];
            image.data[index + 1] = color[1];
            image.data[index + 2] = color[2];
            image.data[index + 3] = 255;
        }
    }
    context.putImageData(image, 0, 0);
    return canvas;
}

const pictures = {};
function picture(name) {
    if (!pictures[name]) {
        pictures[name] = paint(ART[name]);
    }
    return pictures[name];
}

class ItemBehavior extends Trait {
    constructor(kind, dir) {
        super();
        this.kind = kind;
        this.dir = dir < 0 ? -1 : 1;
        this.emerging = 16;
        this.alive = true;
    }

    update(entity, {deltaTime}, level) {
        if (!this.alive) {
            this.queue(item => level.entities.delete(item));
            return;
        }

        if (this.emerging > 0) {
            const step = Math.min(this.emerging, 36 * deltaTime);
            entity.pos.y -= step;
            this.emerging -= step;
            if (this.emerging <= 0 && this.kind !== 'flower') {
                entity.vel.x = this.dir * (this.kind === 'star' ? 80 : 60);
            }
            return;
        }

        if (this.kind === 'flower') {
            return;
        }

        const previousX = entity.vel.x;
        entity.pos.x += entity.vel.x * deltaTime;
        level.tileCollider.checkX(entity, {deltaTime}, level);
        if (previousX && entity.vel.x === 0) {
            entity.vel.x = -previousX;
        }

        entity.vel.y += level.gravity * deltaTime;
        entity.pos.y += entity.vel.y * deltaTime;
        level.tileCollider.checkY(entity, {deltaTime}, level);
        if (this.kind === 'star' && entity.vel.y === 0) {
            entity.vel.y = -360;
        }
    }

    collides(us, them) {
        for (const trait of them.traits.values()) {
            if (trait.receiveItem) {
                trait.receiveItem(this.kind, them);
                this.alive = false;
                return;
            }
        }
    }
}

function playFx(url) {
    const audio = new Audio(url);
    audio.play().catch(() => {});
}

export function spawnPowerup(kind, level, x, y, dir = 1) {
    const item = new Entity();
    item.pos.set(x, y);
    item.size.set(16, 16);
    item.addTrait(new Solid());
    item.addTrait(new ItemBehavior(kind, dir));
    playFx('/audio/fx/power-up-appears.ogg');
    const sprite = picture(kind === '1up' ? '1up' : kind);
    item.draw = function drawItem(context) {
        context.drawImage(sprite, 0, 0);
    };
    level.entities.add(item);
}

export function spawnFireball(mario, level) {
    let count = 0;
    for (const entity of level.entities) {
        if (entity.fireball) {
            count += 1;
        }
    }
    if (count >= 2) {
        return;
    }

    const ball = new Entity();
    ball.fireball = true;
    const heading = mario.traits.get(Go).heading < 0 ? -1 : 1;
    ball.pos.set(mario.pos.x + (heading < 0 ? -8 : mario.size.x), mario.pos.y + 8);
    ball.size.set(8, 8);
    ball.vel.set(heading * 220, -40);
    ball.lifetime = 0;

    const life = new Trait();
    life.update = (entity, {deltaTime}, currentLevel) => {
        entity.lifetime += deltaTime;
        entity.vel.y += currentLevel.gravity * deltaTime * 0.45;
        entity.pos.x += entity.vel.x * deltaTime;
        entity.pos.y += entity.vel.y * deltaTime;
        if (entity.vel.y > 0) {
            currentLevel.tileCollider.checkY(entity, {deltaTime}, currentLevel);
            if (entity.vel.y === 0) {
                entity.vel.y = -140;
            }
        }
        if (entity.lifetime > 1.4) {
            life.queue(item => currentLevel.entities.delete(item));
        }
    };
    life.collides = (us, them) => {
        const killable = them.traits.get(Killable);
        if (!killable || killable.dead) {
            return;
        }
        for (const trait of them.traits.values()) {
            if (trait.receiveItem) {
                return;
            }
        }
        if (them === mario) {
            return;
        }
        killable.kill();
        life.queue(item => level.entities.delete(item));
    };
    ball.addTrait(life);
    const sprite = picture('fire');
    ball.draw = function drawFire(context) {
        context.drawImage(sprite, 0, 0);
    };
    level.entities.add(ball);
    playFx('/audio/fx/fireball.ogg');
}
