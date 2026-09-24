function getScreenshot() {
    var canvas = document.querySelector('#game canvas');
    if (!canvas) return;
    var link = document.createElement('a');
    link.download = 'super-mario-phaser.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}
