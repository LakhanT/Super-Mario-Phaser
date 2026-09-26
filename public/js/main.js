import Level from './Level.js?v=9';
import Timer from './Timer.js?v=9';
import Pipe from './traits/Pipe.js?v=9';
import {createLevelLoader} from './loaders/level.js?v=9';
import {createGamepad} from './Gamepad.js?v=9';
import Player from './traits/Player.js?v=9';
import Killable from './traits/Killable.js?v=9';
import LevelTimer from './traits/LevelTimer.js?v=9';
import Go from './traits/Go.js?v=9';
import Solid from './traits/Solid.js?v=9';
import PoleTraveller from './traits/PoleTraveller.js?v=9';
import {loadFont} from './loaders/font.js?v=9';
import {loadEntities} from './entities.js?v=9';
import {makePlayer, bootstrapPlayer, resetPlayer, findPlayers} from './player.js?v=9';
import {setupKeyboard} from './input.js?v=9';
import {createColorLayer} from './layers/color.js?v=9';
import {createTextLayer} from './layers/text.js?v=9';
import {createDashboardLayer} from './layers/dashboard.js?v=9';
import { createPlayerProgressLayer } from './layers/player-progress.js?v=9';
import SceneRunner from './SceneRunner.js?v=9';
import Scene from './Scene.js?v=9';
import TimedScene from './TimedScene.js?v=9';
import { connectEntity } from './traits/Pipe.js?v=9';

async function main(canvas) {
    const videoContext = canvas.getContext('2d');
    const audioContext = new AudioContext();

    const [entityFactory, font] = await Promise.all([
        loadEntities(audioContext),
        loadFont(),
    ]);


    const loadLevel = await createLevelLoader(entityFactory);

    const sceneRunner = new SceneRunner();

    const mario = entityFactory.mario();
    makePlayer(mario, "MARIO");

    window.mario = mario;

    const inputRouter = setupKeyboard(window);
    inputRouter.addReceiver(mario);

    function createLoadingScreen(name) {
        const scene = new Scene();
        scene.comp.layers.push(createColorLayer('#000'));
        scene.comp.layers.push(createTextLayer(font, `Loading ${name}...`));
        return scene;
    }

    async function setupLevel(name) {
        const loadingScreen = createLoadingScreen(name);
        sceneRunner.addScene(loadingScreen);
        sceneRunner.runNext();

        const level = await loadLevel(name);
        bootstrapPlayer(mario, level);

        level.events.listen(Level.EVENT_TRIGGER, (spec, trigger, touches) => {
            if (spec.type === "goto") {
                for (const _ of findPlayers(touches)) {
                    startWorld(spec.name);
                    return;
                }
            }
        });

        level.events.listen(Pipe.EVENT_PIPE_COMPLETE, async pipe => {
            if (pipe.props.goesTo) {
                const nextLevel = await setupLevel(pipe.props.goesTo.name);
                sceneRunner.addScene(nextLevel);
                sceneRunner.runNext();
                if (pipe.props.backTo) {
                    console.log(pipe.props);
                    nextLevel.events.listen(Level.EVENT_COMPLETE, async () => {
                        const level = await setupLevel(name);
                        const exitPipe = level.entities.get(pipe.props.backTo);
                        connectEntity(exitPipe, mario);
                        sceneRunner.addScene(level);
                        sceneRunner.runNext();
                    });
                }
            } else {
                level.events.emit(Level.EVENT_COMPLETE);
            }
        });

        const dashboardLayer = createDashboardLayer(font, mario);
        level.comp.layers.push(dashboardLayer);

        level.events.listen(Level.EVENT_PLAYER_DEAD, () => {
            if (resolvingLife) {
                return;
            }
            resolvingLife = true;
            const player = mario.traits.get(Player);
            player.lives -= 1;
            player.form = 'small';
            player.stopStar();
            player.invincible = 0;
            mario.size.set(14, 16);
            mario.offset.set(0, 0);
            if (player.lives > 0) {
                startWorld(name);
                return;
            }
            player.lives = 3;
            showBoot('GAME OVER', 2200).then(() => startWorld('1-1'));
        });

        level.events.listen(Level.EVENT_FINISH, () => {
            if (resolvingLife) {
                return;
            }
            resolvingLife = true;
            const player = mario.traits.get(Player);
            const timer = mario.traits.get(LevelTimer);
            player.stopStar();
            player.score += Math.max(0, Math.floor(timer.currentTime)) * 50;
            level.music.pause();
            playOnce('/audio/music/level-clear.ogg');
            const next = NEXT_LEVEL[name];
            showBoot(next ? 'COURSE CLEAR' : 'YOUR QUEST IS OVER', 2200)
                .then(() => startWorld(next || '1-1'));
        });

        return level;
    }

    const NEXT_LEVEL = {
        '1-1': '1-2',
        '1-2': '1-3',
        '1-3': '1-4',
        '1-4': '2-1',
        '2-1': '2-2',
        '2-2': '2-3',
        '2-3': '2-4',
        '2-4': '3-1',
        '3-1': '5-3',
        '5-3': '7-2',
        '7-2': '7-3',
    };

    let resolvingLife = false;

    function playOnce(url) {
        const audio = new Audio(url);
        audio.play().catch(() => {});
    }

    function showBoot(text, ms) {
        boot.hidden = false;
        playButton.hidden = true;
        statusEl.textContent = text;
        return new Promise(resolve => {
            setTimeout(() => {
                boot.hidden = true;
                playButton.hidden = false;
                resolve();
            }, ms);
        });
    }

    function prepareMario() {
        mario.traits.get(Killable).revive();
        const death = [...mario.traits.values()].find(trait => trait.reset && trait.started !== undefined);
        if (death) {
            death.reset();
        }
        mario.vel.set(0, 0);
        mario.traits.get(Go).dir = 0;
        mario.traits.get(Solid).obstructs = true;
        const pole = mario.traits.get(PoleTraveller);
        pole.holding = false;
        pole.exiting = false;
        pole.distance = 0;
    }

    async function startWorld(name) {
        prepareMario();
        const level = await setupLevel(name);
        resetPlayer(mario, name);

        const playerProgressLayer = createPlayerProgressLayer(font, level);
        const dashboardLayer = createDashboardLayer(font, mario);

        const waitScreen = new TimedScene();
        waitScreen.countDown = 1;
        waitScreen.comp.layers.push(createColorLayer('#000'));
        waitScreen.comp.layers.push(dashboardLayer);
        waitScreen.comp.layers.push(playerProgressLayer);

        sceneRunner.addScene(waitScreen);
        sceneRunner.addScene(level);
        sceneRunner.runNext();
        resolvingLife = false;
    }

    const gameContext = {
        audioContext,
        videoContext,
        entityFactory,
        deltaTime: null,
        tick: 0,
    };

    const applyGamepad = createGamepad(document.getElementById('pad-status'));
    const timer = new Timer(1/60);
    timer.update = function update(deltaTime) {
        gameContext.tick++;
        gameContext.deltaTime = deltaTime;
        try {
            applyGamepad(mario);
        } catch (error) {
            console.error(error);
        }
        sceneRunner.update(gameContext);
    }

    timer.start();

    await startWorld('1-1');
}

const canvas = document.getElementById('screen');
const boot = document.getElementById('boot');
const statusEl = document.getElementById('boot-status');
const playButton = document.getElementById('play');

window.__marioReady = true;

playButton.addEventListener('click', () => {
    playButton.disabled = true;
    statusEl.textContent = 'Loading world 1-1...';
    main(canvas).then(() => {
        boot.hidden = true;
    }).catch(error => {
        console.error(error);
        statusEl.textContent = error.message || 'The game failed to load';
        playButton.disabled = false;
    });
});
