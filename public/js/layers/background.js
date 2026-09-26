import TileResolver from '../TileResolver.js?v=9';

export function createBackgroundLayer(level, tiles, sprites) {
    const resolver = new TileResolver(tiles);

    const buffer = document.createElement('canvas');
    buffer.width = 432 + 32;
    buffer.height = 240;

    const context = buffer.getContext('2d');

    function redraw(startIndex, endIndex)  {
        context.clearRect(0, 0, buffer.width, buffer.height);

        for (let x = startIndex; x <= endIndex; ++x) {
            const col = tiles.grid[x];
            if (col) {
                col.forEach((tile, y) => {
                    if (!tile.style) {
                        return;
                    }
                    const age = tile.bumpedAt == null ? 1 : level.totalTime - tile.bumpedAt;
                    const lift = age >= 0 && age < 0.18 ? Math.sin(age / 0.18 * Math.PI) * 10 : 0;
                    const frame = sprites.animations.has(tile.style)
                        ? sprites.animations.get(tile.style)(level.totalTime)
                        : tile.style;
                    sprites.draw(frame, context, (x - startIndex) * 16, y * 16 - lift);
                });
            }
        }
    }

    return function drawBackgroundLayer(context, camera) {
        const drawWidth = resolver.toIndex(camera.size.x);
        const drawFrom = resolver.toIndex(camera.pos.x);
        const drawTo = drawFrom + drawWidth;
        redraw(drawFrom, drawTo);

        context.drawImage(buffer,
            Math.floor(-camera.pos.x % 16),
            Math.floor(-camera.pos.y));
    };
}
