import Keyboard from './KeyboardState.js?v=9';
import InputRouter from './InputRouter.js?v=9';
import Jump from './traits/Jump.js?v=9';
import PipeTraveller from './traits/PipeTraveller.js?v=9';
import Go from './traits/Go.js?v=9';

const KEYMAP = {
    UP: ['KeyW', 'ArrowUp'],
    DOWN: ['KeyS', 'ArrowDown'],
    LEFT: ['KeyA', 'ArrowLeft'],
    RIGHT: ['KeyD', 'ArrowRight'],
    A: ['KeyP', 'Space', 'ArrowUp', 'KeyW', 'KeyZ'],
    B: ['KeyO', 'ShiftLeft', 'ShiftRight'],
};

export function setupKeyboard(window) {
    const input = new Keyboard();
    const router = new InputRouter();

    input.listenTo(window);

    function mapKeys(keys, handler) {
        for (const key of keys) {
            input.addMapping(key, handler);
        }
    }

    mapKeys(KEYMAP.A, keyState => {
        if (keyState) {
            router.route(entity => entity.traits.get(Jump).start());
        } else {
            router.route(entity => entity.traits.get(Jump).cancel());
        }
    });

    mapKeys(KEYMAP.B, keyState => {
        router.route(entity => {
            entity.turbo(keyState);
            if (keyState) {
                const player = [...entity.traits.values()].find(trait => trait.wantsFire !== undefined);
                if (player) {
                    player.wantsFire = true;
                }
            }
        });
    });

    mapKeys(KEYMAP.UP, keyState => {
        router.route(entity => {
            entity.traits.get(PipeTraveller).direction.y += keyState ? -1 : 1;
            const jump = entity.traits.get(Jump);
            if (!jump) {
                return;
            }
            if (keyState) {
                jump.start();
            } else {
                jump.cancel();
            }
        });
    });

    mapKeys(KEYMAP.DOWN, keyState => {
        router.route(entity => {
            entity.traits.get(PipeTraveller).direction.y += keyState ? 1 : -1;
            const player = [...entity.traits.values()].find(trait => trait.keyCrouch !== undefined);
            if (player) {
                player.keyCrouch = !!keyState;
            }
        });
    });

    mapKeys(KEYMAP.RIGHT, keyState => {
        router.route(entity => {
            entity.traits.get(Go).dir += keyState ? 1 : -1;
            entity.traits.get(PipeTraveller).direction.x += keyState ? 1 : -1;
        });
    });

    mapKeys(KEYMAP.LEFT, keyState => {
        router.route(entity => {
            entity.traits.get(Go).dir += keyState ? -1 : 1;
            entity.traits.get(PipeTraveller).direction.x += keyState ? -1 : 1;
        });
    });

    return router;
}
