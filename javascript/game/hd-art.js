var HD = 4;
var HD_TEXTURES = {};

function installModernScale() {
    if (Phaser.GameObjects.Image.prototype.__modernScale) return;
    var original = Phaser.GameObjects.Image.prototype.setScale;
    Phaser.GameObjects.Image.prototype.setScale = function (x, y) {
        var yy = y === undefined ? x : y;
        var key = this.texture && this.texture.key;
        var factor = (key && HD_TEXTURES[key] && this.type !== 'TileSprite') ? HD : 1;
        return original.call(this, x / factor, yy / factor);
    };
    Phaser.GameObjects.Image.prototype.__modernScale = true;

    var originalTile = Phaser.GameObjects.GameObjectFactory.prototype.tileSprite;
    Phaser.GameObjects.GameObjectFactory.prototype.tileSprite = function () {
        var tile = originalTile.apply(this, arguments);
        var key = tile.texture && tile.texture.key;
        if (key && HD_TEXTURES[key] && tile.setTileScale) tile.setTileScale(1 / HD, 1 / HD);
        return tile;
    };
}

function buildModernArt() {
    var scene = this;
    paintBackdrop(scene, 'hd-sky-overworld', false);
    paintBackdrop(scene, 'hd-sky-underground', true);

    eachFrame(scene, 'mario', function (ctx, w, h, frame) { drawHero(ctx, w, h, frame, 'small'); });
    eachFrame(scene, 'mario-grown', function (ctx, w, h, frame) { drawHero(ctx, w, h, frame, 'grown'); });
    eachFrame(scene, 'mario-fire', function (ctx, w, h, frame) { drawHero(ctx, w, h, frame, 'fire'); });
    eachFrame(scene, 'goomba', function (ctx, w, h, frame) { drawCritter(ctx, w, h, frame); });
    eachFrame(scene, 'npc', function (ctx, w, h, frame) { drawHero(ctx, w, h, frame === 1 ? 2 : 0, 'grown'); });
    eachFrame(scene, 'coin', function (ctx, w, h, frame) { drawCoin(ctx, w, h, frame); });
    eachFrame(scene, 'ground-coin', function (ctx, w, h, frame) { drawCoin(ctx, w, h, frame); });
    eachFrame(scene, 'fire-flower', function (ctx, w, h, frame) { drawLantern(ctx, w, h, frame); });
    eachFrame(scene, 'mistery-block', function (ctx, w, h, frame) { drawBrick(ctx, w, h, 'gold', frame); });
    eachFrame(scene, 'custom-block', function (ctx, w, h, frame) { drawBrick(ctx, w, h, 'gold', frame); });
    eachFrame(scene, 'brick-debris', function (ctx, w, h, frame) { drawShard(ctx, w, h, frame); });
    eachFrame(scene, 'fireball', function (ctx, w, h, frame) { drawFireball(ctx, w, h, frame); });
    eachFrame(scene, 'fireball-explosion', function (ctx, w, h, frame) { drawBurst(ctx, w, h, frame); });

    redrawImage(scene, 'super-mushroom', function (ctx, w, h) { drawBerry(ctx, w, h, false); });
    redrawImage(scene, 'live-mushroom', function (ctx, w, h) { drawBerry(ctx, w, h, true); });
    redrawImage(scene, 'block', function (ctx, w, h) { drawBrick(ctx, w, h, 'brick', 0); });
    redrawImage(scene, 'block2', function (ctx, w, h) { drawBrick(ctx, w, h, 'night', 0); });
    redrawImage(scene, 'emptyBlock', function (ctx, w, h) { drawBrick(ctx, w, h, 'empty', 0); });
    redrawImage(scene, 'immovableBlock', function (ctx, w, h) { drawBrick(ctx, w, h, 'stone', 0); });
    redrawImage(scene, 'floorbricks', function (ctx, w, h) { drawGround(ctx, w, h, !isLevelOverworld); });
    redrawImage(scene, 'start-floorbricks', function (ctx, w, h) { drawGround(ctx, w, h, false); });
    redrawImage(scene, 'cloud1', drawCloud);
    redrawImage(scene, 'cloud2', drawCloud);
    redrawImage(scene, 'mountain1', function (ctx, w, h) { drawHills(ctx, w, h, false); });
    redrawImage(scene, 'mountain2', function (ctx, w, h) { drawHills(ctx, w, h, true); });
    redrawImage(scene, 'bush1', drawBush);
    redrawImage(scene, 'bush2', drawBush);
    redrawImage(scene, 'fence', drawFence);
    redrawImage(scene, 'castle', drawCastle);
    redrawImage(scene, 'final-flag', drawPennant);
    redrawImage(scene, 'flag-mast', drawPole);
    redrawImage(scene, 'sign', drawTrailSign);
    ['horizontal-tube', 'horizontal-final-tube', 'vertical-extralarge-tube', 'vertical-small-tube', 'vertical-medium-tube', 'vertical-large-tube'].forEach(function (key) {
        redrawImage(scene, key, drawPipe);
    });
}

function paintBackdrop(scene, key, underground) {
    if (!scene.textures.exists(key)) return;
    var canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    var ctx = canvas.getContext('2d');
    if (underground) drawCaveBackdrop(ctx, canvas.width, canvas.height);
    else drawSkyBackdrop(ctx, canvas.width, canvas.height);
    scene.textures.remove(key);
    scene.textures.addImage(key, canvas);
    scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
}

function eachFrame(scene, key, draw) {
    if (!scene.textures.exists(key)) return;
    var tex = scene.textures.get(key);
    var base = tex.get(0);
    var names = tex.getFrameNames().filter(function (name) { return name !== '__BASE'; });
    var count = names.length || 1;
    var fw = base.cutWidth || base.width;
    var fh = base.cutHeight || base.height;
    var canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(fw * HD * count));
    canvas.height = Math.max(1, Math.round(fh * HD));
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    for (var i = 0; i < count; i++) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(i * fw * HD, 0, fw * HD, fh * HD);
        ctx.clip();
        ctx.translate(i * fw * HD, 0);
        draw(ctx, fw * HD, fh * HD, i, count);
        ctx.restore();
    }
    scene.textures.remove(key);
    scene.textures.addSpriteSheet(key, canvas, { frameWidth: fw * HD, frameHeight: fh * HD });
    scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
    HD_TEXTURES[key] = true;
}

function redrawImage(scene, key, draw) {
    if (!scene.textures.exists(key)) return;
    var source = scene.textures.get(key).getSourceImage();
    var w = Math.max(1, source.width * HD);
    var h = Math.max(1, source.height * HD);
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    draw(ctx, w, h);
    scene.textures.remove(key);
    scene.textures.addImage(key, canvas);
    scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
    HD_TEXTURES[key] = true;
}

function roundBox(ctx, x, y, w, h, r) {
    var radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
}

function drawHero(ctx, w, h, frame, mode) {
    var poses = mode === 'small'
        ? ['idle', 'run1', 'run2', 'run3', 'hurt', 'jump']
        : (mode === 'fire'
            ? ['idle', 'run1', 'run2', 'run3', 'crouch', 'jump', 'throw']
            : ['idle', 'run1', 'run2', 'run3', 'crouch', 'jump']);
    var pose = poses[frame] || 'idle';
    var fire = mode === 'fire';
    var u = w / 18;
    var tall = h > w * 1.35;
    var leg = (pose === 'run1' ? -1 : pose === 'run3' ? 1 : 0);
    var crouch = pose === 'crouch';
    var air = pose === 'jump' || pose === 'throw';
    var hurt = pose === 'hurt';
    ctx.translate(w / 2, h - u * 0.6);
    if (hurt) ctx.rotate(-0.18);
    if (crouch) ctx.translate(0, u * (tall ? 4 : 2));

    var legH = (tall ? 7.2 : 3.1) * u;
    var bodyH = (tall ? 8.4 : 4.6) * u;
    if (crouch) bodyH *= 0.72;
    var headR = (tall ? 5.1 : 4.5) * u;
    var skin = '#ffe0c4';
    var hood = fire ? '#ff6a3c' : '#3c7dff';
    var hoodDark = fire ? '#d94b24' : '#2456c4';
    var scarf = fire ? '#ffd166' : '#ff8f3f';
    var pants = '#243056';
    var boot = '#f2c14e';

    function limb(x, y, len, rot, color, thick) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        roundBox(ctx, -thick / 2, 0, thick, len, thick / 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
    }

    var hip = -legH;
    limb(-u * 1.5, hip, legH, air ? 0.5 : 0.35 * leg, pants, u * 2.1);
    limb(u * 1.5, hip, legH, air ? -0.7 : -0.35 * leg, pants, u * 2.1);
    roundBox(ctx, -u * 2.3, hip + legH * 0.62, u * 2.5, u * 1.7, u * 0.6);
    ctx.fillStyle = boot;
    ctx.fill();
    roundBox(ctx, u * 0.2, hip + legH * 0.62, u * 2.5, u * 1.7, u * 0.6);
    ctx.fill();

    roundBox(ctx, -u * 3.3, hip - bodyH, u * 6.6, bodyH, u * 1.8);
    var torso = ctx.createLinearGradient(0, hip - bodyH, 0, hip);
    torso.addColorStop(0, hood);
    torso.addColorStop(1, hoodDark);
    ctx.fillStyle = torso;
    ctx.fill();

    ctx.fillStyle = scarf;
    ctx.beginPath();
    ctx.moveTo(-u * 1.2, hip - bodyH + u * 0.4);
    ctx.lineTo(u * 3.4, hip - bodyH + u * 2.2);
    ctx.lineTo(u * 1.2, hip - bodyH + u * 3.4);
    ctx.lineTo(-u * 1.6, hip - bodyH + u * 1.5);
    ctx.fill();

    var armRot = pose === 'throw' ? -1.3 : (air ? -0.8 : 0.4 * leg);
    limb(-u * 3.1, hip - bodyH + u * 1.4, u * (tall ? 6 : 3.4), 0.4 - armRot, skin, u * 1.5);
    limb(u * 3.1, hip - bodyH + u * 1.4, u * (tall ? 6 : 3.4), -0.5 + armRot, skin, u * 1.5);

    ctx.fillStyle = hoodDark;
    ctx.beginPath();
    ctx.arc(0, hip - bodyH - headR * 0.72, headR * 1.08, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(0, hip - bodyH - headR * 0.55, headR * 0.82, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hood;
    ctx.beginPath();
    ctx.arc(0, hip - bodyH - headR * 0.95, headR * 0.95, Math.PI * 1.05, Math.PI * 1.95);
    ctx.fill();

    var eyeY = hip - bodyH - headR * 0.62;
    ctx.fillStyle = hurt ? '#c47b74' : '#1b2340';
    if (hurt) {
        ctx.fillRect(-u * 1.8, eyeY, u * 1.3, u * 0.35);
        ctx.fillRect(u * 0.5, eyeY, u * 1.3, u * 0.35);
    } else {
        ctx.beginPath();
        ctx.ellipse(-u * 1.15, eyeY, u * 0.55, u * 0.7, 0, 0, Math.PI * 2);
        ctx.ellipse(u * 1.15, eyeY, u * 0.55, u * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-u * 0.95, eyeY - u * 0.2, u * 0.18, 0, Math.PI * 2);
        ctx.arc(u * 1.35, eyeY - u * 0.2, u * 0.18, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = '#5b3418';
    ctx.beginPath();
    ctx.arc(-u * 2.2, hip - bodyH - headR * 1.35, u * 0.7, 0, Math.PI * 2);
    ctx.arc(u * 2.1, hip - bodyH - headR * 1.45, u * 0.55, 0, Math.PI * 2);
    ctx.fill();
}

function drawCritter(ctx, w, h, frame) {
    var u = Math.min(w, h) / 16;
    ctx.translate(w / 2, h * 0.92);
    if (frame === 2) {
        ctx.scale(1.15, 0.45);
        ctx.translate(0, u * 6);
    } else {
        ctx.translate((frame === 0 ? -1 : 1) * u * 0.4, 0);
    }
    ctx.fillStyle = '#6a3b22';
    roundBox(ctx, -u * 4.2, -u * 2.2, u * 3.1, u * 2.3, u);
    ctx.fill();
    roundBox(ctx, u * 1.1, -u * 2.2, u * 3.1, u * 2.3, u);
    ctx.fill();
    var body = ctx.createLinearGradient(0, -u * 12, 0, 0);
    body.addColorStop(0, '#ffb15a');
    body.addColorStop(1, '#e07a32');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, -u * 6.2, u * 6.2, u * 5.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f6d7b0';
    ctx.beginPath();
    ctx.ellipse(0, -u * 4.6, u * 3.4, u * 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2f6b45';
    ctx.beginPath();
    ctx.ellipse(0, -u * 11.2, u * 1.3, u * 2.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1b2340';
    ctx.beginPath();
    ctx.arc(-u * 1.8, -u * 6.8, u * 0.85, 0, Math.PI * 2);
    ctx.arc(u * 1.8, -u * 6.8, u * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-u * 1.55, -u * 7.05, u * 0.25, 0, Math.PI * 2);
    ctx.arc(u * 2.05, -u * 7.05, u * 0.25, 0, Math.PI * 2);
    ctx.fill();
}

function drawCoin(ctx, w, h, frame) {
    var spin = [1, 0.62, 0.18, 0.62][frame % 4];
    ctx.translate(w / 2, h / 2);
    ctx.scale(spin, 1);
    var rad = Math.min(w, h) * 0.38;
    var gold = ctx.createLinearGradient(-rad, -rad, rad, rad);
    gold.addColorStop(0, '#fff1b8');
    gold.addColorStop(0.45, '#f2c14e');
    gold.addColorStop(1, '#d4891a');
    ctx.fillStyle = gold;
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a86a12';
    ctx.lineWidth = rad * 0.16;
    ctx.stroke();
    ctx.fillStyle = '#fff8df';
    ctx.font = 'bold ' + Math.floor(rad) + 'px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', 0, rad * 0.05);
}

function drawLantern(ctx, w, h, frame) {
    ctx.translate(w / 2, h * 0.92);
    var u = Math.min(w, h) / 16;
    var sway = Math.sin(frame) * 0.08;
    ctx.rotate(sway);
    ctx.fillStyle = '#2f7d4a';
    roundBox(ctx, -u * 0.7, -u * 6, u * 1.4, u * 6, u * 0.4);
    ctx.fill();
    var glow = ctx.createRadialGradient(0, -u * 8, u, 0, -u * 8, u * 5);
    glow.addColorStop(0, '#fff4c2');
    glow.addColorStop(0.5, '#ff9f43');
    glow.addColorStop(1, '#e85d04');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.moveTo(0, -u * 13);
    ctx.bezierCurveTo(u * 6, -u * 10, u * 5, -u * 4, 0, -u * 5.5);
    ctx.bezierCurveTo(-u * 5, -u * 4, -u * 6, -u * 10, 0, -u * 13);
    ctx.fill();
    ctx.fillStyle = '#ffe08a';
    ctx.beginPath();
    ctx.arc(0, -u * 8.2, u * 1.3, 0, Math.PI * 2);
    ctx.fill();
}

function drawBerry(ctx, w, h, life) {
    ctx.translate(w / 2, h * 0.9);
    var u = Math.min(w, h) / 16;
    ctx.fillStyle = '#2f7d4a';
    roundBox(ctx, -u * 0.5, -u * 7, u, u * 3.2, u * 0.4);
    ctx.fill();
    ctx.fillStyle = life ? '#7ae0a0' : '#3cbeff';
    ctx.beginPath();
    ctx.arc(0, -u * 8.5, u * 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(-u * 1.4, -u * 10, u * 1.1, 0, Math.PI * 2);
    ctx.arc(u * 1.5, -u * 9.2, u * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#146b3a';
    ctx.beginPath();
    ctx.ellipse(-u * 1.5, -u * 12.2, u * 1.6, u * 0.7, -0.6, 0, Math.PI * 2);
    ctx.ellipse(u * 1.4, -u * 12.4, u * 1.6, u * 0.7, 0.5, 0, Math.PI * 2);
    ctx.fill();
}

function drawBrick(ctx, w, h, style, frame) {
    var palette = {
        brick: ['#f4b183', '#e07a45', '#b8502e'],
        gold: ['#ffe7a3', '#f2c14e', '#d0891d'],
        empty: ['#e6dfd4', '#c9c0b3', '#9a9186'],
        stone: ['#d5dee6', '#8ea0b0', '#5e6e7d'],
        night: ['#8ea0c4', '#516184', '#33405c']
    }[style] || ['#f4b183', '#e07a45', '#b8502e'];
    var pad = Math.min(w, h) * 0.06;
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, palette[0]);
    grad.addColorStop(0.55, palette[1]);
    grad.addColorStop(1, palette[2]);
    ctx.fillStyle = grad;
    roundBox(ctx, pad, pad, w - pad * 2, h - pad * 2, Math.min(w, h) * 0.18);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    roundBox(ctx, pad + w * 0.12, pad + h * 0.1, w * 0.42, h * 0.16, h * 0.08);
    ctx.fill();
    if (style === 'gold') {
        ctx.fillStyle = frame % 2 === 0 ? '#fff8e8' : '#fff1c4';
        ctx.font = 'bold ' + Math.floor(h * 0.48) + 'px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', w / 2, h / 2 + h * 0.03);
    }
}

function drawShard(ctx, w, h, frame) {
    ctx.translate(w / 2, h / 2);
    ctx.rotate(frame * 0.8);
    ctx.fillStyle = '#e07a45';
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.4);
    ctx.lineTo(w * 0.32, h * 0.28);
    ctx.lineTo(-w * 0.28, h * 0.18);
    ctx.fill();
}

function drawFireball(ctx, w, h) {
    var rad = Math.min(w, h) * 0.36;
    var glow = ctx.createRadialGradient(w / 2, h / 2, rad * 0.2, w / 2, h / 2, rad);
    glow.addColorStop(0, '#fff6d0');
    glow.addColorStop(0.45, '#ff9f1c');
    glow.addColorStop(1, 'rgba(255,90,40,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, rad, 0, Math.PI * 2);
    ctx.fill();
}

function drawBurst(ctx, w, h, frame) {
    ctx.translate(w / 2, h / 2);
    ctx.strokeStyle = frame === 2 ? 'rgba(255,210,120,0.4)' : '#ffd27a';
    ctx.lineWidth = Math.max(2, w * 0.08);
    ctx.beginPath();
    ctx.arc(0, 0, w * (0.18 + frame * 0.12), 0, Math.PI * 2);
    ctx.stroke();
}

function drawGround(ctx, w, h, stone) {
    if (stone) {
        var rock = ctx.createLinearGradient(0, 0, 0, h);
        rock.addColorStop(0, '#6d7c93');
        rock.addColorStop(1, '#3e4a5c');
        ctx.fillStyle = rock;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#8ea0b5';
        ctx.fillRect(0, 0, w, h * 0.16);
        return;
    }
    ctx.fillStyle = '#c4844a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3cbe6e';
    ctx.fillRect(0, 0, w, h * 0.28);
    ctx.fillStyle = '#7dce58';
    ctx.fillRect(0, 0, w, h * 0.08);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(0, h * 0.28, w, h * 0.04);
}

function drawCloud(ctx, w, h) {
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.ellipse(w * 0.38, h * 0.58, w * 0.24, h * 0.28, 0, 0, Math.PI * 2);
    ctx.ellipse(w * 0.58, h * 0.48, w * 0.28, h * 0.34, 0, 0, Math.PI * 2);
    ctx.ellipse(w * 0.72, h * 0.6, w * 0.18, h * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(190,220,245,0.45)';
    ctx.beginPath();
    ctx.ellipse(w * 0.55, h * 0.68, w * 0.22, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawHills(ctx, w, h, far) {
    ctx.fillStyle = far ? '#8ec6ea' : '#67b07a';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h * 0.72);
    ctx.quadraticCurveTo(w * 0.28, h * 0.05, w * 0.55, h * 0.48);
    ctx.quadraticCurveTo(w * 0.78, h * 0.12, w, h * 0.58);
    ctx.lineTo(w, h);
    ctx.fill();
    if (!far) {
        ctx.fillStyle = '#3f9a62';
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(w * 0.2, h * 0.62);
        ctx.lineTo(w * 0.55, h);
        ctx.fill();
    }
}

function drawBush(ctx, w, h) {
    ctx.fillStyle = '#2f9a55';
    ctx.beginPath();
    ctx.arc(w * 0.3, h * 0.62, h * 0.34, 0, Math.PI * 2);
    ctx.arc(w * 0.52, h * 0.48, h * 0.42, 0, Math.PI * 2);
    ctx.arc(w * 0.72, h * 0.64, h * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#67c97a';
    ctx.beginPath();
    ctx.arc(w * 0.46, h * 0.42, h * 0.16, 0, Math.PI * 2);
    ctx.fill();
}

function drawFence(ctx, w, h) {
    ctx.fillStyle = '#f4efe6';
    ctx.fillRect(0, h * 0.28, w, h * 0.12);
    ctx.fillRect(0, h * 0.58, w, h * 0.1);
    var posts = Math.max(2, Math.round(w / (h * 0.7)));
    for (var i = 0; i < posts; i++) {
        var x = (i + 0.2) * (w / posts);
        roundBox(ctx, x, h * 0.08, Math.max(4, w / posts * 0.28), h * 0.84, 4);
        ctx.fill();
    }
}

function drawCastle(ctx, w, h) {
    ctx.fillStyle = '#f3e6d0';
    ctx.fillRect(w * 0.18, h * 0.28, w * 0.64, h * 0.72);
    ctx.fillRect(w * 0.08, h * 0.48, w * 0.2, h * 0.52);
    ctx.fillRect(w * 0.72, h * 0.48, w * 0.2, h * 0.52);
    ctx.fillStyle = '#2a9d8f';
    ctx.fillRect(w * 0.16, h * 0.22, w * 0.68, h * 0.1);
    ctx.fillRect(w * 0.06, h * 0.42, w * 0.24, h * 0.08);
    ctx.fillRect(w * 0.7, h * 0.42, w * 0.24, h * 0.08);
    ctx.fillStyle = '#6f5436';
    roundBox(ctx, w * 0.42, h * 0.62, w * 0.16, h * 0.38, w * 0.04);
    ctx.fill();
    ctx.fillStyle = '#d7efe9';
    ctx.fillRect(w * 0.3, h * 0.4, w * 0.08, h * 0.12);
    ctx.fillRect(w * 0.62, h * 0.4, w * 0.08, h * 0.12);
}

function drawPennant(ctx, w, h) {
    ctx.fillStyle = '#ff5d73';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.15);
    ctx.lineTo(w * 0.92, h * 0.42);
    ctx.lineTo(0, h * 0.7);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(w * 0.08, h * 0.28);
    ctx.lineTo(w * 0.42, h * 0.4);
    ctx.lineTo(w * 0.08, h * 0.52);
    ctx.fill();
}

function drawPole(ctx, w, h) {
    var grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#f7f4ef');
    grad.addColorStop(1, '#c8c2b8');
    ctx.fillStyle = grad;
    roundBox(ctx, w * 0.28, 0, w * 0.44, h, w * 0.2);
    ctx.fill();
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.arc(w / 2, w * 0.45, w * 0.34, 0, Math.PI * 2);
    ctx.fill();
}

function drawPipe(ctx, w, h) {
    var horizontal = w > h * 1.15;
    var grad = ctx.createLinearGradient(0, 0, horizontal ? 0 : w, horizontal ? h : 0);
    grad.addColorStop(0, '#8ef0b0');
    grad.addColorStop(0.45, '#2fbe6a');
    grad.addColorStop(1, '#178a48');
    ctx.fillStyle = grad;
    if (horizontal) {
        roundBox(ctx, w * 0.08, h * 0.2, w * 0.92, h * 0.6, h * 0.2);
        ctx.fill();
        ctx.fillStyle = '#145c32';
        roundBox(ctx, 0, h * 0.08, w * 0.16, h * 0.84, h * 0.12);
        ctx.fill();
    } else {
        roundBox(ctx, w * 0.16, h * 0.08, w * 0.68, h * 0.92, w * 0.16);
        ctx.fill();
        ctx.fillStyle = '#145c32';
        roundBox(ctx, w * 0.06, 0, w * 0.88, Math.max(8, h * 0.12), w * 0.12);
        ctx.fill();
    }
}

function drawTrailSign(ctx, w, h) {
    ctx.fillStyle = '#8d5a34';
    roundBox(ctx, w * 0.46, h * 0.42, w * 0.08, h * 0.58, 8);
    ctx.fill();
    var board = ctx.createLinearGradient(0, 0, 0, h);
    board.addColorStop(0, '#f7f1e4');
    board.addColorStop(1, '#e2d3bc');
    ctx.fillStyle = board;
    roundBox(ctx, w * 0.06, h * 0.08, w * 0.88, h * 0.48, w * 0.04);
    ctx.fill();
    ctx.fillStyle = '#243056';
    ctx.font = 'bold ' + Math.floor(h * 0.16) + 'px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('READY', w / 2, h * 0.32);
}

function drawSkyBackdrop(ctx, w, h) {
    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#6ec6ff');
    sky.addColorStop(0.45, '#b9e4ff');
    sky.addColorStop(1, '#e7f6ff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    var sun = ctx.createRadialGradient(w * 0.78, h * 0.22, 10, w * 0.78, h * 0.22, w * 0.16);
    sun.addColorStop(0, '#fff6d4');
    sun.addColorStop(1, 'rgba(255,246,212,0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    [[0.18, 0.2, 0.12], [0.42, 0.14, 0.08], [0.62, 0.28, 0.1]].forEach(function (cloud) {
        ctx.beginPath();
        ctx.ellipse(w * cloud[0], h * cloud[1], w * cloud[2], h * 0.045, 0, 0, Math.PI * 2);
        ctx.ellipse(w * cloud[0] + w * cloud[2] * 0.7, h * cloud[1] + 10, w * cloud[2] * 0.7, h * 0.035, 0, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.fillStyle = '#9ed0f2';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.78);
    ctx.quadraticCurveTo(w * 0.2, h * 0.62, w * 0.4, h * 0.76);
    ctx.quadraticCurveTo(w * 0.62, h * 0.58, w * 0.82, h * 0.74);
    ctx.quadraticCurveTo(w * 0.92, h * 0.68, w, h * 0.76);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();
    ctx.fillStyle = '#7dbe8b';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.86);
    ctx.quadraticCurveTo(w * 0.3, h * 0.74, w * 0.55, h * 0.86);
    ctx.quadraticCurveTo(w * 0.78, h * 0.78, w, h * 0.88);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();
}

function drawCaveBackdrop(ctx, w, h) {
    var cave = ctx.createLinearGradient(0, 0, 0, h);
    cave.addColorStop(0, '#141a2e');
    cave.addColorStop(0.6, '#243352');
    cave.addColorStop(1, '#1a2740');
    ctx.fillStyle = cave;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#31486a';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h * 0.55);
    ctx.quadraticCurveTo(w * 0.18, h * 0.2, w * 0.35, h * 0.58);
    ctx.lineTo(w * 0.35, h);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w, h);
    ctx.lineTo(w, h * 0.5);
    ctx.quadraticCurveTo(w * 0.78, h * 0.18, w * 0.62, h * 0.6);
    ctx.lineTo(w * 0.62, h);
    ctx.fill();
    var glow = ctx.createRadialGradient(w * 0.5, h * 0.72, 20, w * 0.5, h * 0.72, w * 0.28);
    glow.addColorStop(0, 'rgba(120, 220, 200, 0.35)');
    glow.addColorStop(1, 'rgba(120, 220, 200, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
}
