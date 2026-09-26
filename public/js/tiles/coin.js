import Player from "../traits/Player.js?v=9";

function handle({entity, match, resolver}) {
    const player = entity.traits.get(Player);
    if (player) {
        player.addCoins(1);
        const grid = resolver.matrix;
        grid.delete(match.indexX, match.indexY);
    }
}

export const coin = [handle, handle];
