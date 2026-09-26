const DEADZONE = 0.28;

function buttonDown(pad, index) {
    const button = pad.buttons && pad.buttons[index];
    if (!button) {
        return false;
    }
    return button.pressed || button.value > 0.45;
}

function anyDown(pad, indexes) {
    return indexes.some(index => buttonDown(pad, index));
}

function connectedPads() {
    const source = navigator.getGamepads ? navigator.getGamepads() : [];
    const pads = [];
    for (const pad of source) {
        if (pad && pad.connected) {
            pads.push(pad);
        }
    }
    return pads;
}

function stick(pad) {
    const axes = pad.axes || [];
    const pairs = [[0, 1], [2, 3], [4, 5]];
    let best = {x: axes[0] || 0, y: axes[1] || 0, mag: 0};
    for (const [ix, iy] of pairs) {
        const x = axes[ix] || 0;
        const y = axes[iy] || 0;
        const mag = Math.hypot(x, y);
        if (mag > best.mag) {
            best = {x, y, mag};
        }
    }
    return best;
}

export function createGamepad(statusEl) {
    let previousJump = false;
    let previousRun = false;
    let wasMoving = false;
    let seen = false;

    window.addEventListener('gamepadconnected', () => {
        seen = true;
        if (statusEl) {
            statusEl.textContent = 'Xbox ready: stick move, A jump, B run/fire';
        }
    });

    return function applyGamepad(mario) {
        let pad = null;
        try {
            const pads = connectedPads();
            pad = pads.find(item => item.buttons.some(button => button.pressed || button.value > 0.45)) || pads[0] || null;
        } catch (error) {
            return;
        }

        if (!pad || !mario) {
            if (statusEl && !seen) {
                statusEl.textContent = 'Xbox: press A once so the browser can see the pad';
            }
            return;
        }
        seen = true;

        const motion = stick(pad);
        const left = motion.x < -DEADZONE || buttonDown(pad, 14);
        const right = motion.x > DEADZONE || buttonDown(pad, 15);
        const up = motion.y < -DEADZONE || buttonDown(pad, 12);
        const down = motion.y > DEADZONE || buttonDown(pad, 13);
        const moving = left || right;

        let go = null;
        let jump = null;
        let pipe = null;
        let player = null;
        for (const trait of mario.traits.values()) {
            if (go === null && 'dragFactor' in trait && 'heading' in trait) go = trait;
            if (jump === null && 'engageTime' in trait && 'gracePeriod' in trait) jump = trait;
            if (pipe === null && trait.direction && trait.movement) pipe = trait;
            if (player === null && 'wantsFire' in trait) player = trait;
        }

        if (go && (moving || wasMoving)) {
            go.dir = (right ? 1 : 0) - (left ? 1 : 0);
        }
        wasMoving = moving;

        if (pipe && (moving || up || down)) {
            pipe.direction.x = (right ? 1 : 0) - (left ? 1 : 0);
            pipe.direction.y = (down ? 1 : 0) - (up ? 1 : 0);
        }

        const jumpDown = anyDown(pad, [0, 2, 3]) || up;
        if (jump) {
            if (jumpDown && !previousJump) jump.start();
            else if (!jumpDown && previousJump) jump.cancel();
        }
        previousJump = jumpDown;

        const runDown = anyDown(pad, [1, 5, 7]);
        if (runDown !== previousRun && mario.turbo) {
            mario.turbo(runDown);
        }
        if (runDown && player) {
            player.wantsFire = true;
        }
        if (player) {
            player.padCrouch = down && !up;
        }
        previousRun = runDown;

        if (statusEl) {
            statusEl.textContent = 'Xbox connected';
        }
    };
}
