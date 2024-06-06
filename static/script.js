import { initCanvas } from "./render.js";
import { createWindowEvents } from "./windowevents.js";
import { gameLoop, loadFPS } from "./engine.js"

export function startGame() {
    loadFPS()
    initCanvas();
    createWindowEvents();
    requestAnimationFrame(gameLoop);
}
