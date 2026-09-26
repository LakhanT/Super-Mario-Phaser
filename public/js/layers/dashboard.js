import Player from "../traits/Player.js?v=9";
import LevelTimer from "../traits/LevelTimer.js?v=9";
import {findPlayers} from "../player.js?v=9";

export function createDashboardLayer(font, entity) {
    const LINE1 = font.size * 2;
    const LINE2 = font.size * 3;

    return function drawDashboard(context) {
        const playerTrait = entity.traits.get(Player);
        const timerTrait = entity.traits.get(LevelTimer);

        font.print(playerTrait.name, context, 24, LINE1);
        font.print(playerTrait.score.toString().padStart(6, '0'), context, 24, LINE2);

        font.print('×' + playerTrait.coins.toString().padStart(2, '0'), context, 128, LINE2);

        font.print('LIVES', context, 192, LINE1);
        font.print('×' + playerTrait.lives.toString().padStart(2, '0'), context, 200, LINE2);

        font.print('WORLD', context, 272, LINE1);
        font.print(playerTrait.world, context, 280, LINE2);

        font.print('TIME', context, 360, LINE1);
        font.print(timerTrait.currentTime.toFixed().toString().padStart(3, '0'), context, 368, LINE2);
    };
}
