
const goombasVelocityX = screenWidth / 19

function createGoombas() {
    this.goombasGroup = this.add.group();

    for (i = 0; i < Math.trunc(worldWidth / 960); i++) {
        let x = generateRandomCoordinate(true);
        let goomba = this.physics.add.sprite(x, screenHeight - platformHeight, 'goomba').setOrigin(0.5, 1).setBounce(1, 0).setScale(screenHeight / 376);
        goomba.anims.play('goomba-walk', true);
        goomba.smoothed = true;
        goomba.depth = 2;
        if (Phaser.Math.Between(0, 10) <= 4) {
            goomba.setVelocityX(goombasVelocityX)
        } else {
            goomba.setVelocityX(-goombasVelocityX)
        }
        goomba.setMaxVelocity(goombasVelocityX, levelGravity)
        this.goombasGroup.add(goomba);
    }

    this.physics.add.collider(this.goombasGroup, this.platformGroup);
    this.physics.add.collider(this.goombasGroup, this.blocksGroup);
    this.physics.add.collider(this.goombasGroup, this.misteryBlocksGroup);
    this.physics.add.collider(this.goombasGroup, this.goombasGroup);
    this.physics.add.collider(this.goombasGroup, this.finalFlagMast);
    this.physics.add.overlap(player, this.goombasGroup, checkGoombaCollision, null, this);
    this.physics.add.collider(this.goombasGroup, this.immovableBlocksGroup);
    this.physics.add.collider(this.goombasGroup, this.fallProtectionGroup);
    if (this.finalTrigger) this.physics.add.collider(this.goombasGroup, this.finalTrigger);
}

function checkGoombaCollision(player, goomba) {

    if (goomba.dead)
        return;
    
    let goombaBeingStomped = player.body.touching.down && goomba.body.touching.up;

    if (flagRaised)
        return;

    if (playerInvulnerable) {
        if (!goombaBeingStomped) {
            return;
        }
    }
    
    if (goombaBeingStomped) {
        goomba.anims.play('goomba-hurt', true);
        goomba.body.enable = false;
        this.goombasGroup.remove(goomba);
        this.goombaStompSound.play();
        player.setVelocityY(-velocityY / 1.5);
        addToScore.call(this, 100, goomba);
        feedbackHit(this, 'stomp');
        setTimeout(() => {
            this.tweens.add({
                targets: goomba,
                duration: 300,
                alpha: 0
            });
        }, 200);
        setTimeout(() => {
            goomba.destroy();
        }, 500);
        return;
    }
    
    decreasePlayerState.call(this);
        
    return;
}

function clearGoombas() {
    let goombas = this.goombasGroup.getChildren();

    for (let i = 0; i < goombas.length; i++) {
        if (goombas[i].body.velocity.x == 0 || (goombas[i].body.velocity.x > 0 && goombas[i].body.velocity.x != goombasVelocityX) || (goombas[i].body.velocity.x < 0 && goombas[i].body.velocity.x != -goombasVelocityX)) {
            this.goombasGroup.remove(goombas[i]);
            goombas[i].destroy();
        }
    }
}
