var coinsCollected = 0;
var titleOpen = false;

function applyAudioSettings() {
    var settings = readSettings();
    if (!this.musicGroup) return;
    this.sound.volume = settings.mute ? 0 : settings.master;
    var music = this.musicGroup.getChildren();
    for (var i = 0; i < music.length; i++) {
        if (music[i].baseVolume == null) music[i].baseVolume = music[i].volume;
        music[i].setMute(settings.mute || !settings.musicEnabled);
        music[i].setVolume(music[i].baseVolume * settings.music);
    }
    var effects = this.effectsGroup.getChildren();
    for (var j = 0; j < effects.length; j++) {
        if (effects[j].baseVolume == null) effects[j].baseVolume = effects[j].volume;
        effects[j].setMute(settings.mute || !settings.effectsEnabled);
        effects[j].setVolume(effects[j].baseVolume * settings.effects);
    }
}

function beginRun() {
    if (levelStarted || !this.musicTheme) return;
    titleOpen = false;
    if (this.titleLayer) this.titleLayer.setVisible(false);
    this.powerDownSound.play();
    this.physics.world.setBounds(screenWidth, 0, worldWidth, screenHeight);
    applyPlayerInvulnerability.call(this, 4000);
    playerBlocked = true;
    player.setVelocityX(5);
    player.anims.play('run', true).flipX = false;
    var duration = readSettings().reducedMotion ? 0 : 650;
    this.cameras.main.fadeOut(duration, 14, 28, 48);
    this.hereWeGoSound.play();
    var scene = this;
    setTimeout(function () {
        if (!isLevelOverworld) {
            player.y = screenHeight / 5;
            scene.musicTheme.stop();
            scene.undergroundMusicTheme.play({ loop: -1 });
            showUndergroundSky.call(scene);
        }
        player.x = screenWidth * 1.1;
        scene.cameras.main.pan(screenWidth * 1.5, 0, 0);
        playerBlocked = false;
        scene.cameras.main.fadeIn(duration || 200, 14, 28, 48);
        createHUD.call(scene);
        updateTimer.call(scene);
        if (scene.startScreenTrigger) scene.startScreenTrigger.destroy();
        levelStarted = true;
        setTouchVisible(scene, true);
        if (scene.settingsOpen) closeSettings.call(scene);
    }, duration ? 720 : 30);
}

function openTitle() {
    titleOpen = true;
    playerBlocked = true;
    var scene = this;
    var layer = scene.add.container(0, 0).setScrollFactor(0).setDepth(50);
    scene.titleLayer = layer;
    var dim = scene.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x102033, 0.45).setScrollFactor(0);
    var panel = scene.add.graphics().setScrollFactor(0);
    panel.fillStyle(0x142033, 0.78);
    panel.fillRoundedRect(screenWidth / 2 - 280, 70, 560, 580, 28);
    var kicker = scene.add.text(screenWidth / 2, 128, 'SIDE SCROLLING RUN', {
        fontFamily: UI_FONT, fontSize: '18px', color: '#ffd166'
    }).setOrigin(0.5).setScrollFactor(0);
    var title = scene.add.text(screenWidth / 2, 188, 'SUPER MARIO\nPHASER', {
        fontFamily: UI_FONT, fontSize: '64px', color: '#fffaf3', align: 'center', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0);
    var sub = scene.add.text(screenWidth / 2, 292, 'Arrow keys or WASD  ·  Space jumps  ·  A controller works too', {
        fontFamily: UI_FONT, fontSize: '16px', color: '#d5e4f2'
    }).setOrigin(0.5).setScrollFactor(0);
    layer.add([dim, panel, kicker, title, sub]);
    makeButton(scene, layer, screenWidth / 2, 370, 'PLAY', function () { beginRun.call(scene); });
    makeButton(scene, layer, screenWidth / 2, 440, 'SETTINGS', function () { openSettings.call(scene); });
    makeButton(scene, layer, screenWidth / 2, 510, 'HOW TO PLAY', function () { openInfo.call(scene, 'How to play', howToCopy()); });
    makeButton(scene, layer, screenWidth / 2, 580, 'CREDITS', function () { openInfo.call(scene, 'Credits', creditCopy()); });
}

function howToCopy() {
    return 'Move with A D or the arrow keys.\nJump with Space, W, or Up.\nCrouch with S or Down after a berry.\nShoot with Q or F after a lantern flower.\n\nA controller uses the stick or D-pad to move,\nA / Cross to jump, B / Circle to shoot,\nand Start to pause.\n\nOn a touch screen, use the buttons\nat the bottom of the game.';
}

function creditCopy() {
    return 'A browser platformer with a randomly built course.\nThe new art, menus, and controls are original.\nGameplay stays a classic run to the flag.\nMusic and effects come with the project.';
}

function makeButton(scene, layer, x, y, label, onClick, width) {
    width = width || 320;
    var height = 54;
    var bg = scene.add.graphics().setScrollFactor(0);
    function paint(fill) {
        bg.clear();
        bg.fillStyle(fill, 1);
        bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 16);
    }
    paint(0xf4f7fb);
    var text = scene.add.text(x, y, label, {
        fontFamily: UI_FONT, fontSize: '22px', color: '#1b2340', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0);
    var zone = scene.add.zone(x, y, width, height).setScrollFactor(0).setInteractive({ useHandCursor: true });
    zone.on('pointerover', function () { paint(0xffe3b3); });
    zone.on('pointerout', function () { paint(0xf4f7fb); });
    zone.on('pointerdown', function () { onClick(); });
    layer.add([bg, text, zone]);
    return zone;
}

function openInfo(title, body) {
    var scene = this;
    if (scene.infoLayer) scene.infoLayer.destroy();
    var layer = scene.add.container(0, 0).setScrollFactor(0).setDepth(75);
    scene.infoLayer = layer;
    var dim = scene.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x0c121c, 0.72).setScrollFactor(0);
    var panel = scene.add.graphics().setScrollFactor(0);
    panel.fillStyle(0xf7f4ef, 1);
    panel.fillRoundedRect(240, 90, 800, 520, 24);
    var heading = scene.add.text(screenWidth / 2, 140, title, {
        fontFamily: UI_FONT, fontSize: '40px', color: '#1b2340'
    }).setOrigin(0.5).setScrollFactor(0);
    var copy = scene.add.text(screenWidth / 2, 340, body, {
        fontFamily: UI_FONT, fontSize: '22px', color: '#243044', align: 'center', lineSpacing: 8
    }).setOrigin(0.5).setScrollFactor(0);
    layer.add([dim, panel, heading, copy]);
    makeButton(scene, layer, screenWidth / 2, 540, 'BACK', function () {
        layer.destroy();
        scene.infoLayer = null;
    });
}

function openSettings() {
    var scene = this;
    if (scene.settingsOpen) return;
    scene.settingsOpen = true;
    if (levelStarted && !scene.isPaused) {
        scene.physics.pause();
        scene.anims.pauseAll();
    }
    var settings = readSettings();
    var layer = scene.add.container(0, 0).setScrollFactor(0).setDepth(80);
    scene.settingsLayer = layer;
    var dim = scene.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x0c121c, 0.78).setScrollFactor(0);
    var panel = scene.add.graphics().setScrollFactor(0);
    panel.fillStyle(0xf6f3ee, 1);
    panel.fillRoundedRect(70, 36, 1140, 650, 24);
    var heading = scene.add.text(110, 62, 'Settings', {
        fontFamily: UI_FONT, fontSize: '40px', color: '#1b2340'
    }).setScrollFactor(0);
    layer.add([dim, panel, heading]);

    addSlider(scene, layer, 110, 150, 'Master', settings.master, function (value) {
        settings.master = value;
        writeSettings(settings);
        applyAudioSettings.call(scene);
    });
    addSlider(scene, layer, 110, 230, 'Music', settings.music, function (value) {
        settings.music = value;
        settings.musicEnabled = value > 0.01;
        writeSettings(settings);
        applyAudioSettings.call(scene);
    });
    addSlider(scene, layer, 110, 310, 'Effects', settings.effects, function (value) {
        settings.effects = value;
        settings.effectsEnabled = value > 0.01;
        writeSettings(settings);
        applyAudioSettings.call(scene);
    });
    addToggle(scene, layer, 110, 390, 'Mute all', settings.mute, function (value) {
        settings.mute = value;
        writeSettings(settings);
        applyAudioSettings.call(scene);
    });
    addToggle(scene, layer, 110, 450, 'Screen shake', settings.shake, function (value) {
        settings.shake = value;
        writeSettings(settings);
    });
    addToggle(scene, layer, 110, 510, 'Reduce motion', settings.reducedMotion, function (value) {
        settings.reducedMotion = value;
        writeSettings(settings);
    });
    addToggle(scene, layer, 110, 570, 'Controller vibration', settings.haptics, function (value) {
        settings.haptics = value;
        writeSettings(settings);
    });

    var controlsTitle = scene.add.text(620, 130, 'Keyboard  ·  click a key to change it', {
        fontFamily: UI_FONT, fontSize: '20px', color: '#1b2340'
    }).setScrollFactor(0);
    layer.add(controlsTitle);
    var actions = [
        ['left', 'Move left'],
        ['right', 'Move right'],
        ['jump', 'Jump'],
        ['crouch', 'Crouch'],
        ['fire', 'Fire'],
        ['pause', 'Pause']
    ];
    actions.forEach(function (pair, index) {
        var y = 180 + index * 62;
        var label = scene.add.text(620, y, pair[1], {
            fontFamily: UI_FONT, fontSize: '22px', color: '#243044'
        }).setOrigin(0, 0.5).setScrollFactor(0);
        layer.add(label);
        addBindChip(scene, layer, 980, y, pair[0], settings);
    });

    var padLine = scene.add.text(620, 570, 'Gamepad: stick or D-pad, A jump, B fire, Start pause', {
        fontFamily: UI_FONT, fontSize: '16px', color: '#5c6b7a'
    }).setScrollFactor(0);
    layer.add(padLine);
    makeButton(scene, layer, 1040, 78, 'CLOSE', function () { closeSettings.call(scene); }, 200);
    var full = scene.add.text(360, 620, 'Fullscreen', {
        fontFamily: UI_FONT, fontSize: '20px', color: '#2456c4'
    }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
    full.on('pointerdown', function () {
        if (scene.scale.isFullscreen) scene.scale.stopFullscreen();
        else scene.scale.startFullscreen();
    });
    layer.add(full);
}

function closeSettings() {
    this.settingsOpen = false;
    if (this.settingsLayer) {
        this.settingsLayer.destroy();
        this.settingsLayer = null;
    }
    if (levelStarted && !this.isPaused) {
        this.physics.resume();
        this.anims.resumeAll();
    }
    applyAudioSettings.call(this);
}

function addSlider(scene, layer, x, y, label, value, onChange) {
    var caption = scene.add.text(x, y, label, {
        fontFamily: UI_FONT, fontSize: '20px', color: '#1b2340'
    }).setOrigin(0, 0.5).setScrollFactor(0);
    var left = x + 150;
    var track = scene.add.rectangle(left + 110, y, 220, 8, 0xd5dbe3).setScrollFactor(0);
    var knob = scene.add.circle(left + 220 * value, y, 12, 0x2456c4).setScrollFactor(0).setInteractive({ useHandCursor: true });
    scene.input.setDraggable(knob);
    var readout = scene.add.text(left + 240, y, Math.round(value * 100) + '%', {
        fontFamily: UI_FONT, fontSize: '18px', color: '#1b2340'
    }).setOrigin(0, 0.5).setScrollFactor(0);
    knob.on('drag', function (pointer, dragX) {
        var next = Phaser.Math.Clamp((dragX - left) / 220, 0, 1);
        knob.x = left + 220 * next;
        readout.setText(Math.round(next * 100) + '%');
        onChange(next);
    });
    layer.add([caption, track, knob, readout]);
}

function addToggle(scene, layer, x, y, label, value, onChange) {
    var text = scene.add.text(x, y, label, {
        fontFamily: UI_FONT, fontSize: '20px', color: '#1b2340'
    }).setOrigin(0, 0.5).setScrollFactor(0);
    var box = scene.add.rectangle(x + 280, y, 54, 30, value ? 0x2fbe6a : 0xc5ced8).setScrollFactor(0);
    var knob = scene.add.circle(x + 280 + (value ? 12 : -12), y, 11, 0xffffff).setScrollFactor(0);
    box.setInteractive({ useHandCursor: true });
    box.on('pointerdown', function () {
        value = !value;
        box.setFillStyle(value ? 0x2fbe6a : 0xc5ced8);
        knob.x = x + 280 + (value ? 12 : -12);
        onChange(value);
    });
    layer.add([text, box, knob]);
}

function addBindChip(scene, layer, x, y, action, settings) {
    var codes = (settings.binds && settings.binds[action]) || BIND_DEFAULTS[action];
    var chip = scene.add.text(x, y, codes.map(keyLabel).join(' / '), {
        fontFamily: UI_FONT, fontSize: '18px', color: '#1b2340', backgroundColor: '#e7eef6', padding: { x: 10, y: 6 }
    }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
    chip.on('pointerdown', function () {
        if (rebinding) return;
        rebinding = true;
        chip.setText('Press a key');
        var handler = function (event) {
            document.removeEventListener('keydown', handler);
            rebinding = false;
            if (event.keyCode === 27) {
                chip.setText(codes.map(keyLabel).join(' / '));
                return;
            }
            var conflict = null;
            Object.keys(BIND_DEFAULTS).forEach(function (other) {
                if (other === action) return;
                var list = (settings.binds && settings.binds[other]) || BIND_DEFAULTS[other];
                if (list.indexOf(event.keyCode) !== -1) conflict = other;
            });
            var commit = function () {
                settings.binds = settings.binds || {};
                Object.keys(BIND_DEFAULTS).forEach(function (name) {
                    if (!settings.binds[name]) settings.binds[name] = BIND_DEFAULTS[name].slice();
                });
                if (conflict) {
                    settings.binds[conflict] = settings.binds[conflict].filter(function (code) { return code !== event.keyCode; });
                    if (!settings.binds[conflict].length) settings.binds[conflict] = BIND_DEFAULTS[conflict].slice();
                }
                settings.binds[action] = [event.keyCode];
                writeSettings(settings);
                applyBinds(scene, settings.binds);
                closeSettings.call(scene);
                openSettings.call(scene);
            };
            if (conflict) openBindModal(scene, keyLabel(event.keyCode), conflict, commit, function () {
                chip.setText(codes.map(keyLabel).join(' / '));
            });
            else commit();
        };
        document.addEventListener('keydown', handler);
    });
    layer.add(chip);
}

function openBindModal(scene, keyNameText, action, onReplace, onCancel) {
    var layer = scene.add.container(0, 0).setScrollFactor(0).setDepth(95);
    var dim = scene.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x0c121c, 0.45).setScrollFactor(0);
    var panel = scene.add.graphics().setScrollFactor(0);
    panel.fillStyle(0xffffff, 1);
    panel.fillRoundedRect(340, 230, 600, 250, 20);
    var copy = scene.add.text(screenWidth / 2, 300, keyNameText + ' is already used for ' + action + '.\nReplace that binding?', {
        fontFamily: UI_FONT, fontSize: '24px', color: '#1b2340', align: 'center'
    }).setOrigin(0.5).setScrollFactor(0);
    layer.add([dim, panel, copy]);
    makeButton(scene, layer, screenWidth / 2 - 130, 410, 'REPLACE', function () {
        layer.destroy();
        onReplace();
    }, 200);
    makeButton(scene, layer, screenWidth / 2 + 130, 410, 'CANCEL', function () {
        layer.destroy();
        onCancel();
    }, 200);
}

function togglePause() {
    if (!levelStarted || gameOver || gameWinned || flagRaised || titleOpen) return;
    if (this.isPaused) resumeGame.call(this);
    else openPause.call(this);
}

function openPause() {
    var scene = this;
    scene.isPaused = true;
    playerBlocked = true;
    scene.physics.pause();
    scene.anims.pauseAll();
    scene.musicTheme && scene.musicTheme.setVolume && applyAudioSettings.call(scene);
    if (scene.musicTheme && !scene.musicTheme.isPaused) scene.musicTheme.pause();
    var layer = scene.add.container(0, 0).setScrollFactor(0).setDepth(70);
    scene.pauseLayer = layer;
    var dim = scene.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x0c121c, 0.55).setScrollFactor(0);
    var title = scene.add.text(screenWidth / 2, 180, 'PAUSED', {
        fontFamily: UI_FONT, fontSize: '64px', color: '#fffaf3'
    }).setOrigin(0.5).setScrollFactor(0);
    layer.add([dim, title]);
    makeButton(scene, layer, screenWidth / 2, 300, 'RESUME', function () { resumeGame.call(scene); });
    makeButton(scene, layer, screenWidth / 2, 370, 'SETTINGS', function () { openSettings.call(scene); });
    makeButton(scene, layer, screenWidth / 2, 440, 'RESTART', function () {
        sessionStorage.setItem('smp-autoplay', '1');
        location.reload();
    });
    makeButton(scene, layer, screenWidth / 2, 510, 'MAIN MENU', function () { location.reload(); });
}

function resumeGame() {
    this.isPaused = false;
    if (!gameOver && !gameWinned) playerBlocked = false;
    if (this.pauseLayer) {
        this.pauseLayer.destroy();
        this.pauseLayer = null;
    }
    if (!this.settingsOpen) {
        this.physics.resume();
        this.anims.resumeAll();
        if (this.musicTheme && this.musicTheme.isPaused) this.musicTheme.resume();
    }
}

function showEndScreen(title, detail) {
    var scene = this;
    var layer = scene.add.container(0, 0).setScrollFactor(0).setDepth(70);
    var dim = scene.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x101820, 0).setScrollFactor(0);
    scene.tweens.add({ targets: dim, alpha: 0.82, duration: readSettings().reducedMotion ? 0 : 280 });
    var heading = scene.add.text(screenWidth / 2, 150, title, {
        fontFamily: UI_FONT, fontSize: '58px', color: '#fffaf3'
    }).setOrigin(0.5).setScrollFactor(0);
    var body = scene.add.text(screenWidth / 2, 280, detail, {
        fontFamily: UI_FONT, fontSize: '24px', color: '#d7e4f0', align: 'center', lineSpacing: 8
    }).setOrigin(0.5).setScrollFactor(0);
    layer.add([dim, heading, body]);
    makeButton(scene, layer, screenWidth / 2, 430, 'PLAY AGAIN', function () {
        sessionStorage.setItem('smp-autoplay', '1');
        location.reload();
    });
    makeButton(scene, layer, screenWidth / 2, 500, 'MAIN MENU', function () { location.reload(); });
    makeButton(scene, layer, screenWidth / 2, 570, 'SCREENSHOT', function () { getScreenshot(); });
}

function endDetail(extra) {
    var best = localStorage.getItem('high-score') || score;
    return 'Score   ' + score.toLocaleString() + '\nCoins   ' + coinsCollected + '\n' + (extra || '') + 'Best   ' + Number(best).toLocaleString();
}

function noteCoin(scene, x, y) {
    coinsCollected += 1;
    if (scene.coinText) scene.coinText.setText(String(coinsCollected));
    if (readSettings().reducedMotion || x == null) return;
    for (var i = 0; i < 5; i++) {
        var dot = scene.add.circle(x, y, 4, 0xf2c14e, 0.95).setDepth(6);
        scene.tweens.add({
            targets: dot,
            x: x + Phaser.Math.Between(-36, 36),
            y: y - Phaser.Math.Between(10, 48),
            alpha: 0,
            duration: 320,
            onComplete: function () { dot.destroy(); }
        });
    }
}
