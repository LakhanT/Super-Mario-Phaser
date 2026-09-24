function applyCrispPixelArt() {
    var pixelFonts = { carrier_command: true };
    if (!Phaser.Textures || !Phaser.Textures.FilterMode) return;
    this.textures.getTextureKeys().forEach(function (key) {
        var texture = this.textures.get(key);
        if (!texture || !texture.setFilter) return;
        var mode = pixelFonts[key] ? Phaser.Textures.FilterMode.NEAREST : Phaser.Textures.FilterMode.LINEAR;
        texture.setFilter(mode);
    }, this);
}

function placeLevelBackdropSize(backdrop, underground) {
    if (underground) {
        backdrop.setDisplaySize(screenWidth * 1.12, screenHeight * 1.28);
        backdrop.y = screenHeight * 0.46;
    } else {
        backdrop.setDisplaySize(screenWidth * 1.12, screenHeight * 1.08);
        backdrop.y = screenHeight * 0.5;
    }
}

function placeLevelBackdrop(key, underground) {
    var backdrop = this.add.image(screenWidth / 2, screenHeight / 2, key)
        .setScrollFactor(0)
        .setDepth(-2);
    placeLevelBackdropSize(backdrop, underground);
    return backdrop;
}

function createLevelVisuals() {
    applyCrispPixelArt.call(this);

    if (this.textures.exists('hd-sky-overworld')) {
        this.levelBackdrop = placeLevelBackdrop.call(this, 'hd-sky-overworld', false);
    }

    this.playerShadow = this.add.ellipse(player.x, player.y, 22, 6, 0x071018, 0.38)
        .setDepth(2.6);

    this.cameras.main.roundPixels = true;
}

function showUndergroundSky() {
    if (!this.levelBackdrop || !this.textures.exists('hd-sky-underground')) return;
    this.levelBackdrop.setTexture('hd-sky-underground');
    placeLevelBackdropSize(this.levelBackdrop, true);
}

function showOverworldSky() {
    if (!this.levelBackdrop || !this.textures.exists('hd-sky-overworld')) return;
    this.levelBackdrop.setTexture('hd-sky-overworld');
    placeLevelBackdropSize(this.levelBackdrop, false);
}

function updateLevelVisuals() {
    if (this.playerShadow && player && player.body) {
        var grounded = player.body.blocked.down || player.body.touching.down;
        this.playerShadow.setPosition(player.x - player.displayWidth * 0.5, player.body.bottom - 1);
        this.playerShadow.setScale(
            Math.max(14, player.displayWidth * (grounded ? 0.72 : 0.48)) / 22,
            Math.max(4, player.displayHeight * 0.07) / 6
        );
        this.playerShadow.setAlpha(grounded ? 0.34 : 0.12);
        this.playerShadow.setVisible(player.alpha > 0.05 && player.y < screenHeight);
    }

    if (!this.levelBackdrop) return;

    var span = Math.max(1, worldWidth - screenWidth);
    var progress = Phaser.Math.Clamp(this.cameras.main.scrollX / span, 0, 1);
    this.levelBackdrop.x = screenWidth / 2 + (0.5 - progress) * screenWidth * 0.06;
}
