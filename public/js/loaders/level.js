import {Matrix, Vec2} from '../math.js?v=9';
import Entity from '../Entity.js?v=9';
import Trait from '../Trait.js?v=9';
import LevelTimer from '../traits/LevelTimer.js?v=9';
import Trigger from '../traits/Trigger.js?v=9';
import Level from '../Level.js?v=9';
import {createSpriteLayer} from '../layers/sprites.js?v=9';
import {createBackgroundLayer} from '../layers/background.js?v=9';
import {loadMusicSheet} from './music.js?v=9';
import {loadSpriteSheet} from './sprite.js?v=9';
import {loadJSON} from '../loaders.js?v=9';

function createSpawner() {
    class Spawner extends Trait {
        constructor() {
            super();
            this.entities = [];
            this.offsetX = 64;
        }

        addEntity(entity) {
            this.entities.push(entity);
            this.entities.sort((a, b) => a.pos.x < b.pos.x ? -1 : 1);
        }

        update(entity, gameContext, level) {
            const cameraMaxX = level.camera.pos.x + level.camera.size.x + this.offsetX;
            while (this.entities[0]) {
                if (cameraMaxX > this.entities[0].pos.x) {
                    level.entities.add(this.entities.shift());
                } else {
                    break;
                }
            }

        }
    }

    return new Spawner();
}

function loadPattern(name) {
    return loadJSON(`/sprites/patterns/${name}.json`);
}

function setupBehavior(level) {
    level.events.listen(LevelTimer.EVENT_TIMER_OK, () => {
        level.music.playTheme();
    });
    level.events.listen(LevelTimer.EVENT_TIMER_HURRY, () => {
        level.music.playHurryTheme();
    });
}

function setupBackgrounds(levelSpec, level, patterns, levelName) {
    levelSpec.layers.forEach(layer => {
        const grid = createGrid(layer.tiles, patterns, levelName);
        level.tileCollider.addGrid(grid);
    });
}

function setupCamera(level) {
    let maxX = 0;
    let maxTileSize = 0;
    for (const resolver of level.tileCollider.resolvers) {
        if (resolver.tileSize > maxTileSize) {
            maxTileSize = resolver.tileSize;
        }
        resolver.matrix.forEach((tile, x, y) => {
            if (x > maxX) {
                maxX = x;
            }
        });
    }
    level.camera.max.x = (maxX + 1) * maxTileSize;
}

function setupCheckpoints(levelSpec, level) {
    if (!levelSpec.checkpoints) {
        level.checkpoints.push(new Vec2(0, 0));
        return;
    }

    levelSpec.checkpoints.forEach(([x, y]) => {
        level.checkpoints.push(new Vec2(x, y));
    });
}

function setupEntities(levelSpec, level, entityFactory) {
    const spawner = createSpawner();
    levelSpec.entities.forEach(({id, name, pos: [x, y], props}) => {
        const createEntity = entityFactory[name];
        if (!createEntity) {
            throw new Error(`No entity ${name}`);
        }

        const entity = createEntity(props);
        entity.pos.set(x, y);

        if (id) {
            entity.id = id;
            level.entities.add(entity);
        } else {
            spawner.addEntity(entity);
        }
    });

    const entityProxy = new Entity();
    entityProxy.addTrait(spawner);
    level.entities.add(entityProxy);
}

function setupTriggers(levelSpec, level) {
    if (!levelSpec.triggers) {
        return;
    }

    for (const triggerSpec of levelSpec.triggers) {
        const trigger = new Trigger();

        trigger.conditions.push((entity, touches, gc, level) => {
            level.events.emit(Level.EVENT_TRIGGER, triggerSpec, entity, touches);
        });

        const entity = new Entity();
        entity.addTrait(trigger);
        entity.size.set(64, 64);
        entity.pos.set(triggerSpec.pos[0], triggerSpec.pos[1]);
        level.entities.add(entity);
    }
}

function spawnFlagPoles(levelSpec, level, entityFactory) {
    const createPole = entityFactory['flag-pole'];
    if (!createPole) {
        return;
    }

    const alreadyPlaced = (levelSpec.entities || []).some(entity => entity.name === 'flag-pole');
    if (alreadyPlaced) {
        return;
    }

    for (const layer of levelSpec.layers) {
        for (const tile of layer.tiles || []) {
            if (tile.pattern !== 'flag-pole-green' && tile.pattern !== 'flag-pole-dark-grey') {
                continue;
            }

            for (const range of tile.ranges) {
                const x = range[0];
                const y = range.length === 2 ? range[1] : range[2];
                const pole = createPole();
                pole.pos.set(x * 16, (y + 1) * 16);
                level.entities.add(pole);
            }
        }
    }
}

export function createLevelLoader(entityFactory) {
    return function loadLevel(name) {
        return loadJSON(`/levels/${name}.json?v=9`)
        .then(levelSpec => Promise.all([
            levelSpec,
            loadSpriteSheet(levelSpec.spriteSheet),
            loadMusicSheet(levelSpec.musicSheet),
            loadPattern(levelSpec.patternSheet),
        ]))
        .then(([levelSpec, backgroundSprites, musicPlayer, patterns]) => {
            const level = new Level();
            level.name = name;
            level.sprites = backgroundSprites;
            level.music.setPlayer(musicPlayer);

            setupBackgrounds(levelSpec, level, patterns, name);
            setupEntities(levelSpec, level, entityFactory);
            spawnFlagPoles(levelSpec, level, entityFactory);
            setupTriggers(levelSpec, level);
            setupCheckpoints(levelSpec, level);

            setupBehavior(level);
            setupCamera(level);

            for (const resolver of level.tileCollider.resolvers) {
                const backgroundLayer = createBackgroundLayer(level, resolver.matrix, backgroundSprites);
                level.comp.layers.push(backgroundLayer);
            }

            const spriteLayer = createSpriteLayer(level.entities);
            level.comp.layers.push(spriteLayer);

            return level;
        });
    }
}

const LEVEL_PRIZES = {
    '1-1': {
        chance: {
            '21,9': 'power',
            '78,9': 'power',
            '109,5': 'power',
        },
        brick: {
            '94,9': 'coins10',
            '101,9': 'star',
        },
        hidden: {
            '64,9': '1up',
        },
    },
    '1-2': {
        chance: {
            '10,9': 'power',
            '12,9': 'star',
            '14,9': '1up',
        },
    },
    '1-3': {
        chance: {
            '59,10': 'power',
        },
    },
    '1-4': {
        chance: {
            '31,6': 'power',
        },
    },
    '2-1': {
        chance: {
            '53,9': 'power',
            '55,5': 'star',
            '79,9': 'power',
            '87,9': '1up',
        },
    },
    '2-3': {
        chance: {
            '102,5': 'power',
        },
    },
    '2-4': {
        chance: {
            '23,3': 'power',
        },
    },
    '3-1': {
        chance: {
            '16,9': 'power',
            '22,8': '1up',
            '113,5': 'star',
            '151,5': 'power',
        },
    },
    '5-3': {
        chance: {
            '59,10': 'power',
        },
    },
    '7-3': {
        chance: {
            '102,5': 'power',
        },
    },
};

function instanceTile(tile, x, y, levelName, powerBudget) {
    const copy = {
        style: tile.style,
        behavior: tile.behavior,
    };
    const table = LEVEL_PRIZES[levelName];
    const key = `${x},${y}`;
    if (copy.behavior === 'chance') {
        const listed = table && table.chance && table.chance[key];
        if (listed) {
            copy.item = listed;
        } else if (!table && powerBudget.left > 0) {
            copy.item = 'power';
            powerBudget.left -= 1;
        } else {
            copy.item = 'coin';
        }
    } else if (copy.behavior === 'brick' && table && table.brick && table.brick[key]) {
        copy.item = table.brick[key];
    }
    return copy;
}

function createGrid(tiles, patterns, levelName) {
    const grid = new Matrix();
    const powerBudget = {left: LEVEL_PRIZES[levelName] ? 0 : 1};
    let interactive = false;

    for (const {tile, x, y} of expandTiles(tiles, patterns)) {
        const cell = instanceTile(tile, x, y, levelName, powerBudget);
        if (cell.behavior === 'brick' || cell.behavior === 'chance') {
            interactive = true;
        }
        grid.set(x, y, cell);
    }

    const hidden = LEVEL_PRIZES[levelName] && LEVEL_PRIZES[levelName].hidden;
    if (interactive && hidden) {
        for (const key of Object.keys(hidden)) {
            const [x, y] = key.split(',').map(Number);
            if (!grid.get(x, y)) {
                grid.set(x, y, {
                    style: null,
                    behavior: 'chance',
                    item: hidden[key],
                });
            }
        }
    }

    return grid;
}


function* expandSpan(xStart, xLen, yStart, yLen) {
    const xEnd = xStart + xLen;
    const yEnd = yStart + yLen;
    for (let x = xStart; x < xEnd; ++x) {
        for (let y = yStart; y < yEnd; ++y) {
            yield {x, y};
        }
    }
}

function expandRange(range) {
    if (range.length === 4) {
        const [xStart, xLen, yStart, yLen] = range;
        return expandSpan(xStart, xLen, yStart, yLen);

    } else if (range.length === 3) {
        const [xStart, xLen, yStart] = range;
        return expandSpan(xStart, xLen, yStart, 1);

    } else if (range.length === 2) {
        const [xStart, yStart] = range;
        return expandSpan(xStart, 1, yStart, 1);
    }
}

function* expandRanges(ranges) {
    for (const range of ranges) {
        yield* expandRange(range);
    }
}

function* expandTiles(tiles, patterns) {
    function* walkTiles(tiles, offsetX, offsetY) {
        for (const tile of tiles) {
            for (const {x, y} of expandRanges(tile.ranges)) {
                const derivedX = x + offsetX;
                const derivedY = y + offsetY;

                if (tile.pattern) {
                    const tiles = patterns[tile.pattern].tiles;
                    yield* walkTiles(tiles, derivedX, derivedY);
                } else {
                    yield {
                        tile,
                        x: derivedX,
                        y: derivedY,
                    };
                }
            }
        }
    }

    yield* walkTiles(tiles, 0, 0);
}
