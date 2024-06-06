import { currentPlayer, renderBoxes, renderPlayers } from "./render.js";
import { boxes } from "./mapping.js"
import { playerData, ping1 } from "./worker_handler.js";
import { $BOOLBYTE }  from "./boolbyte.js";
export var x = Math.floor(Math.random() * 1000);
export var y = Math.floor(Math.random() * 1000);
export var speed = 1.15;
export var friction = 0.9;
export var velocityX = 0;
export var velocityY = 0;
export var lastX, lastY, stats, pingPanel;

export var moveDataBinary = new $BOOLBYTE()
export var keypresses = {
    w: false,
    a: false,
    s: false,
    d: false,
};

export function createEngineWindowEvents() {
    window.onkeydown = function (event) {
        switch (event.key) {
            case 'w':
                moveDataBinary.set(4, true)
                break;
            case 'a':
                moveDataBinary.set(5, true)
                break;
            case 's':
                moveDataBinary.set(6, true)
                break;
            case 'd':
                moveDataBinary.set(7, true)
                break;
        }
    };

    window.onkeyup = function (event) {
        switch (event.key) {
            case 'w':
                moveDataBinary.set(4, false)
                break;
            case 'a':
                moveDataBinary.set(5, false)
                break;
            case 's':
                moveDataBinary.set(6, false)
                break;
            case 'd':
                moveDataBinary.set(7, false)
                break;
        }
    };
}

function checkIfMoved() {
    try {
        if (lastX !== currentPlayer.x || lastY !== currentPlayer.y) {
            lastX = currentPlayer.x;
            lastY = currentPlayer.y;
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}

var loop = 0;
let lastFrameTime = performance.now();
const frameRate = 60;
const frameInterval = 1000 / frameRate;

export function gameLoop() {
    loop++;
    const currentTime = performance.now();
    const elapsedTime = currentTime - lastFrameTime;
    try { stats.begin() } catch (e) { }
    updatePredictedPosition();
    reconcilePosition()
    if (!checkIfMoved() || loop < 60) {
        try {
            renderPlayers(playerData);
        } catch (error) { }
        try {
            renderBoxes(boxes);
        } catch (error) { console.log(error) }
    }

    try { pingPanel.update(ping1, ping1 < 25 ? 25 : (ping1 < 75 ? 75 : 200)); } catch (error) { }

    if (elapsedTime >= frameInterval) {
        // This limits the movement speed to 60 times a second, so people with higher hertz monitors don't move faster, but letting them render faster
        lastFrameTime = performance.now() - (elapsedTime % frameInterval);
    }
    try { stats.end() } catch (e) { }

    requestAnimationFrame(gameLoop);
}


export let predictedX = 0;
export let predictedY = 0;

function updatePredictedPosition() {
    // predictedX += velocityX;
    // predictedY += velocityY;

    // velocityX *= friction;
    // velocityY *= friction;
}

function reconcilePosition() {
    // try {
    //     predictedX = currentPlayer.x;
    //     predictedY = currentPlayer.y;
    // } catch (e) {
    // }
}



export function loadFPS() {
    var script = document.createElement('script');
    script.src = 'https://mrdoob.github.io/stats.js/build/stats.min.js';
    document.head.appendChild(script);
    script.onload = () => {
        console.log("Loaded stats.js");
        stats = new Stats();
        document.body.appendChild(stats.dom);
        pingPanel = stats.addPanel(new Stats.Panel('PING', '#f08', '#201'));
        stats.showPanel(0)
    };
}

