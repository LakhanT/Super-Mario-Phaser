import Entity from '../Entity.js?v=9';
import Trait from '../Trait.js?v=9';
import Killable from '../traits/Killable.js?v=9';
import PendulumMove from '../traits/PendulumMove.js?v=9';
import Physics from '../traits/Physics.js?v=9';
import Solid from '../traits/Solid.js?v=9';
import Stomper, {isStomp} from '../traits/Stomper.js?v=9';
import Player, {hitPlayer} from '../traits/Player.js?v=9';
import {loadSpriteSheet} from '../loaders/sprite.js?v=9';

export function loadKoopaGreen() {
    return loadSpriteSheet('koopa-green')
    .then(createKoopaFactory);
}

export function loadKoopaBlue() {
    return loadSpriteSheet('koopa-blue')
        .then(createKoopaFactory);
    }


const STATE_WALKING = Symbol('walking');
const STATE_HIDING = Symbol('hiding');
const STATE_PANIC = Symbol('panic');

class Behavior extends Trait {
    constructor() {
        super();

        this.hideTime = 0;
        this.hideDuration = 5;

        this.walkSpeed = null;
        this.panicSpeed = 300;
        this.combo = 0;

        this.state = STATE_WALKING;
    }

    touches(us, them) {
        return us.bounds.bottom > them.bounds.top - 2
            && us.bounds.top < them.bounds.bottom + 2
            && us.bounds.right > them.bounds.left - 8
            && us.bounds.left < them.bounds.right + 8;
    }

    crushEnemies(us, level) {
        const scores = [100, 200, 400, 800, 1000, 2000, 4000, 8000];
        for (const other of level.entities) {
            if (other === us || other.traits.has(Stomper) || other.traits.has(Player)) {
                continue;
            }
            const life = other.traits.get(Killable);
            if (!life || life.dead || !this.touches(us, other)) {
                continue;
            }
            life.kill();
            other.vel.y = -180;
            let player = null;
            for (const entity of level.entities) {
                if (entity.traits.has(Player)) {
                    player = entity.traits.get(Player);
                    break;
                }
            }
            if (player) {
                player.score += scores[Math.min(this.combo, scores.length - 1)];
                this.combo += 1;
            }
        }
    }

    collides(us, them) {
        if (us.traits.get(Killable).dead) {
            return;
        }

        if (this.state === STATE_PANIC && them.traits.has(Killable) && !them.traits.has(Stomper)) {
            const life = them.traits.get(Killable);
            if (!life.dead) {
                life.kill();
            }
            return;
        }

        if (them.traits.has(Stomper)) {
            if (them.traits.get(Killable).dead) {
                return;
            }

            if (isStomp(them, us)) {
                this.handleStomp(us, them);
            } else {
                this.handleNudge(us, them);
            }
        }
    }

    handleNudge(us, them) {
        if (this.state === STATE_WALKING) {
            hitPlayer(us, them);
        } else if (this.state === STATE_HIDING) {
            this.panic(us, them);
        } else if (this.state === STATE_PANIC) {
            const travelDir = Math.sign(us.vel.x);
            const impactDir = Math.sign(us.pos.x - them.pos.x);
            if (travelDir !== 0 && travelDir !== impactDir) {
                hitPlayer(us, them);
            }
        }
    }

    handleStomp(us, them) {
        if (this.state === STATE_WALKING) {
            this.hide(us);
        } else if (this.state === STATE_HIDING) {
            us.traits.get(Killable).kill();
            us.vel.set(100, -200);
            us.traits.get(Solid).obstructs = false;
        } else if (this.state === STATE_PANIC) {
            this.hide(us);
        }
    }

    hide(us) {
        us.vel.x = 0;
        us.traits.get(PendulumMove).enabled = false;
        if (this.walkSpeed === null) {
            this.walkSpeed = us.traits.get(PendulumMove).speed;
        }
        this.hideTime = 0;
        this.state = STATE_HIDING;
        us.sliding = false;
    }

    unhide(us) {
        us.traits.get(PendulumMove).enabled = true;
        us.traits.get(PendulumMove).speed = this.walkSpeed;
        this.state = STATE_WALKING;
        us.sliding = false;
    }

    panic(us, them) {
        us.traits.get(PendulumMove).enabled = true;
        const dir = them.bounds.meridian < us.bounds.meridian ? 1 : -1;
        us.traits.get(PendulumMove).speed = this.panicSpeed * dir;
        this.combo = 0;
        this.state = STATE_PANIC;
        us.sliding = true;
        const kick = new Audio('/audio/fx/kick.ogg');
        kick.play().catch(() => {});
    }

    update(us, gameContext, level) {
        const deltaTime = gameContext.deltaTime;
        if (this.state === STATE_HIDING) {
            this.hideTime += deltaTime;
            if (this.hideTime > this.hideDuration) {
                this.unhide(us);
            }
        }
        if (this.state === STATE_PANIC && level) {
            us.sliding = true;
            this.crushEnemies(us, level);
        }
    }
}


function createKoopaFactory(sprite) {
    const walkAnim = sprite.animations.get('walk');
    const wakeAnim = sprite.animations.get('wake');

    function routeAnim(koopa) {
        if (koopa.traits.get(Behavior).state === STATE_HIDING) {
            if (koopa.traits.get(Behavior).hideTime > 3) {
                return wakeAnim(koopa.traits.get(Behavior).hideTime);
            }
            return 'hiding';
        }

        if (koopa.traits.get(Behavior).state === STATE_PANIC) {
            return 'hiding';
        }

        return walkAnim(koopa.lifetime);
    }

    function drawKoopa(context) {
        sprite.draw(routeAnim(this), context, 0, 0, this.vel.x < 0);
    }

    return function createKoopa() {
        const koopa = new Entity();
        koopa.size.set(16, 16);
        koopa.offset.y = 8;

        koopa.addTrait(new Physics());
        koopa.addTrait(new Solid());
        koopa.addTrait(new PendulumMove());
        koopa.addTrait(new Killable());
        koopa.addTrait(new Behavior());

        koopa.draw = drawKoopa;

        return koopa;
    };
}
