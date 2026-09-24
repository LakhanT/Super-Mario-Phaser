var UI_FONT = 'Fredoka, Outfit, Nunito, Trebuchet MS, sans-serif';

var BIND_DEFAULTS = null;
var inputState = {
    left: false,
    right: false,
    jump: false,
    crouch: false,
    fire: false,
    pause: false,
    jumpPressed: false,
    firePressed: false,
    pausePressed: false
};
var touchState = { left: false, right: false, jump: false, crouch: false, fire: false };
var bindKeys = {};
var rebinding = false;
var activePad = null;
var padWasConnected = false;

function defaultSettings() {
    return {
        master: 0.85,
        music: 0.8,
        effects: 0.9,
        mute: false,
        musicEnabled: true,
        effectsEnabled: true,
        shake: true,
        reducedMotion: false,
        highContrast: false,
        largeUI: false,
        haptics: true,
        touchOpacity: 0.72,
        touchScale: 1,
        binds: null
    };
}

function readSettings() {
    var defaults = defaultSettings();
    try {
        var raw = localStorage.getItem('smp-settings');
        if (!raw) {
            if (localStorage.getItem('volume')) defaults.master = Math.min(1, Math.max(0, Number(localStorage.getItem('volume')) / 100));
            if (localStorage.getItem('music-enabled') === 'false') defaults.musicEnabled = false;
            if (localStorage.getItem('effects-enabled') === 'false') defaults.effectsEnabled = false;
            return defaults;
        }
        var data = JSON.parse(raw);
        if (!data || typeof data !== 'object') return defaults;
        var merged = Object.assign({}, defaults, data);
        ['master', 'music', 'effects', 'touchOpacity'].forEach(function (key) {
            if (typeof merged[key] !== 'number' || merged[key] < 0 || merged[key] > 1) merged[key] = defaults[key];
        });
        if (typeof merged.touchScale !== 'number' || merged.touchScale < 0.7 || merged.touchScale > 1.4) merged.touchScale = 1;
        if (merged.binds) {
            Object.keys(BIND_DEFAULTS || {}).forEach(function (action) {
                if (!Array.isArray(merged.binds[action]) || !merged.binds[action].length) delete merged.binds[action];
            });
        }
        return merged;
    } catch (err) {
        return defaults;
    }
}

function writeSettings(next) {
    try {
        localStorage.setItem('smp-settings', JSON.stringify(next));
    } catch (err) {
        return;
    }
}

function setupInput(scene) {
    BIND_DEFAULTS = {
        left: [Phaser.Input.Keyboard.KeyCodes.A, Phaser.Input.Keyboard.KeyCodes.LEFT],
        right: [Phaser.Input.Keyboard.KeyCodes.D, Phaser.Input.Keyboard.KeyCodes.RIGHT],
        jump: [Phaser.Input.Keyboard.KeyCodes.SPACE, Phaser.Input.Keyboard.KeyCodes.W, Phaser.Input.Keyboard.KeyCodes.UP],
        crouch: [Phaser.Input.Keyboard.KeyCodes.S, Phaser.Input.Keyboard.KeyCodes.DOWN],
        fire: [Phaser.Input.Keyboard.KeyCodes.Q, Phaser.Input.Keyboard.KeyCodes.F],
        pause: [Phaser.Input.Keyboard.KeyCodes.ESC, Phaser.Input.Keyboard.KeyCodes.P]
    };
    applyBinds(scene, readSettings().binds);
    if (scene.input.gamepad) {
        scene.input.gamepad.on('connected', function (pad) { activePad = pad; });
        scene.input.gamepad.on('disconnected', function () { activePad = null; });
    }
    createTouchControls(scene);
}

function applyBinds(scene, custom) {
    var source = custom || BIND_DEFAULTS;
    Object.keys(BIND_DEFAULTS).forEach(function (action) {
        var codes = (source[action] && source[action].length) ? source[action] : BIND_DEFAULTS[action];
        bindKeys[action] = codes.map(function (code) {
            return scene.input.keyboard.addKey(Number(code));
        });
    });
}

function keyHeld(action) {
    var keys = bindKeys[action] || [];
    for (var i = 0; i < keys.length; i++) {
        if (keys[i] && keys[i].isDown) return true;
    }
    return false;
}

function axisValue(pad, index) {
    if (!pad || !pad.axes || pad.axes[index] == null) return 0;
    var axis = pad.axes[index];
    if (typeof axis === 'number') return axis;
    if (typeof axis.getValue === 'function') return axis.getValue();
    if (typeof axis.value === 'number') return axis.value;
    return 0;
}

function padButton(index) {
    if (!activePad || !activePad.buttons[index]) return false;
    return !!activePad.buttons[index].pressed;
}

function pollInput(scene) {
    if (scene.input.gamepad) {
        var pads = scene.input.gamepad.gamepads || [];
        var found = null;
        for (var i = 0; i < pads.length; i++) {
            if (pads[i] && pads[i].connected) found = pads[i];
        }
        if (found && !padWasConnected) showToast(scene, 'Controller connected');
        if (!found && padWasConnected) showToast(scene, 'Controller disconnected');
        activePad = found;
        padWasConnected = !!found;
    }

    var axisX = axisValue(activePad, 0);
    var axisY = axisValue(activePad, 1);
    var left = keyHeld('left') || touchState.left || axisX < -0.28 || padButton(14);
    var right = keyHeld('right') || touchState.right || axisX > 0.28 || padButton(15);
    var jump = keyHeld('jump') || touchState.jump || padButton(0) || padButton(12);
    var crouch = keyHeld('crouch') || touchState.crouch || axisY > 0.45 || padButton(13);
    var fire = keyHeld('fire') || touchState.fire || padButton(1) || padButton(2);
    var pause = keyHeld('pause') || padButton(9);

    if (scene.joyStick && scene.joyStick.enabled) {
        left = left || scene.joyStick.left;
        right = right || scene.joyStick.right;
        jump = jump || scene.joyStick.up;
        crouch = crouch || scene.joyStick.down;
    }

    inputState.jumpPressed = jump && !inputState.jump;
    inputState.firePressed = fire && !inputState.fire;
    inputState.pausePressed = pause && !inputState.pause;
    inputState.left = left;
    inputState.right = right;
    inputState.jump = jump;
    inputState.crouch = crouch;
    inputState.fire = fire;
    inputState.pause = pause;
}

function rumble(strong, duration) {
    var settings = readSettings();
    if (!settings.haptics || !activePad) return;
    var actuator = activePad.vibrationActuator || (activePad.haptics && activePad.haptics[0]);
    if (!actuator || !actuator.playEffect) return;
    try {
        actuator.playEffect('dual-rumble', {
            duration: duration || 70,
            strongMagnitude: strong || 0.3,
            weakMagnitude: Math.min(1, (strong || 0.3) * 0.6)
        });
    } catch (err) {
        return;
    }
}

function feedbackHit(scene, kind) {
    var settings = readSettings();
    if (settings.shake && !settings.reducedMotion && scene.cameras && scene.cameras.main) {
        scene.cameras.main.shake(kind === 'hurt' ? 140 : 80, kind === 'hurt' ? 0.0045 : 0.0022);
    }
    rumble(kind === 'hurt' ? 0.75 : kind === 'power' ? 0.35 : 0.22, kind === 'hurt' ? 150 : 70);
}

function showToast(scene, message) {
    if (!scene || !scene.add) return;
    if (scene.toastText) scene.toastText.destroy();
    scene.toastText = scene.add.text(screenWidth / 2, screenHeight * 0.18, message, {
        fontFamily: UI_FONT,
        fontSize: '28px',
        color: '#1b2340',
        backgroundColor: '#fff8ea',
        padding: { x: 18, y: 10 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(90);
    scene.tweens.add({
        targets: scene.toastText,
        alpha: 0,
        delay: 1100,
        duration: 400,
        onComplete: function () {
            if (scene.toastText) scene.toastText.destroy();
            scene.toastText = null;
        }
    });
}

function keyLabel(code) {
    var names = {
        8: 'Backspace', 9: 'Tab', 13: 'Enter', 16: 'Shift', 17: 'Ctrl', 18: 'Alt', 27: 'Esc', 32: 'Space',
        37: 'Left', 38: 'Up', 39: 'Right', 40: 'Down',
        65: 'A', 66: 'B', 67: 'C', 68: 'D', 69: 'E', 70: 'F', 81: 'Q', 83: 'S', 87: 'W'
    };
    return names[code] || String.fromCharCode(code) || ('Key ' + code);
}

function createTouchControls(scene) {
    var settings = readSettings();
    var show = mobileDevice || window.matchMedia('(pointer: coarse)').matches;
    scene.touchLayer = scene.add.container(0, 0).setScrollFactor(0).setDepth(45).setVisible(false);
    var buttons = [
        { id: 'left', x: 110, y: 560, label: '◀' },
        { id: 'right', x: 250, y: 560, label: '▶' },
        { id: 'crouch', x: 1040, y: 600, label: '▼' },
        { id: 'fire', x: 1160, y: 500, label: '●' },
        { id: 'jump', x: 1160, y: 610, label: '▲' }
    ];
    buttons.forEach(function (spec) {
        var size = 92 * settings.touchScale;
        var gfx = scene.add.circle(spec.x, spec.y, size / 2, 0x122033, settings.touchOpacity).setScrollFactor(0);
        gfx.setStrokeStyle(3, 0xffffff, 0.35);
        var text = scene.add.text(spec.x, spec.y, spec.label, {
            fontFamily: UI_FONT,
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0);
        gfx.setInteractive({ useHandCursor: false });
        gfx.on('pointerdown', function () { touchState[spec.id] = true; gfx.setFillStyle(0xffffff, 0.28); });
        var release = function () { touchState[spec.id] = false; gfx.setFillStyle(0x122033, readSettings().touchOpacity); };
        gfx.on('pointerup', release);
        gfx.on('pointerout', release);
        gfx.on('pointerupoutside', release);
        scene.touchLayer.add([gfx, text]);
    });
}

function setTouchVisible(scene, visible) {
    if (scene.touchLayer) scene.touchLayer.setVisible(visible && (mobileDevice || window.matchMedia('(pointer: coarse)').matches));
}
