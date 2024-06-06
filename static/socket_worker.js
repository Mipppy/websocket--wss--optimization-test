import { $BOOLBYTE } from "./boolbyte.js";
import { Base64, Base91 } from "./libs/base-ex.esm.min.js"
let socket;
const playerUUID = generate4ByteUUID();
let pingStartTime = 0;
let ping1 = 0;
const LEVEL_DATA_TIMEOUT = 5000;
var fullMoveBinarySend = new Uint8Array(5)
var keypress = []

postMessage({ type: "uuid", uuid: playerUUID });

function initWebSocket(url) {
    try {
        try {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.onclose = () => { };
                socket.close();
            }
        } catch (e) { }

        socket = new WebSocket(url);

        socket.onerror = () => {
            console.log("error");
        };

        socket.onopen = () => {
            console.log("Opened websocket");
            getPlayerData();
            getLevelData().then((level) => { postMessage({ type: "level", level: level }); });
        };

        socket.onmessage = handleMessages;
    } catch (e) {
        console.error("WebSocket initialization error:", e);
    }
}


function getPlayerData() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        var da = new Uint8Array(5);
        var asd = new $BOOLBYTE();

        asd.toggleToMatch(keypress);

        asd.set(0, true);
        asd.set(1, true);
        asd.set(2, true);
        asd.set(3, true);
        da[0] = asd.uint[0];
        for (let i = 0; i < playerUUID.length; i++) {
            da[i + 1] = playerUUID[i];
        }
        socket.send(da);
        pingStartTime = Date.now();
    }
}

function sendMoveData(moveBinary) {
    try {
        if (socket && socket.readyState === WebSocket.OPEN) {
            if (typeof moveBinary.keypresses === 'number' && moveBinary.keypresses >= 0 && moveBinary.keypresses <= 255) {
                fullMoveBinarySend[0] = moveBinary.keypresses;

                for (let i = 0; i < playerUUID.length; i++) {
                    fullMoveBinarySend[i + 1] = playerUUID[i];
                }

                socket.send(fullMoveBinarySend);
            } else {
                console.error("Invalid moveBinary.keypresses value");
            }
        }
    } catch (e) {
        console.error("Error sending move data:", e);
    }
}

async function getLevelData() {
    return await new Promise((resolve, reject) => {
        if (socket && socket.readyState === socket.OPEN) {
            socket.send(JSON.stringify({ type: "getLevel" }));
            const onMessage = event => {
                const parsed = JSON.parse(event.data);
                if (parsed.type === "levelData") {
                    socket.removeEventListener("message", onMessage);
                    resolve(parsed.level);
                }
            };
            socket.addEventListener("message", onMessage);
            setTimeout(() => {
                socket.removeEventListener("message", onMessage);
                reject(new Error("Timeout waiting for level data"));
            }, LEVEL_DATA_TIMEOUT);
        } else {
            reject(new Error("Socket is not open"));
        }
    });
}

function handleMessages(event) {
    var base91 = new Base91()
    var encodedData = base91.decode(event.data, "bytes");

    const numPlayers = encodedData[0];
  
    const playerData = [];
    for (let i = 0; i < numPlayers; i++) {
        const startIndex = 1 + i * 4;
        const int1 = (encodedData[startIndex] << 8) + encodedData[startIndex + 1];
        const int2 = (encodedData[startIndex + 2] << 8) + encodedData[startIndex + 3];
        playerData.push({ int1, int2 });
    }
  
    const uuid = String.fromCharCode.apply(null, encodedData.subarray(1 + numPlayers * 4));
  
    console.log("Decoded Number of Players: " + numPlayers);
    console.log("Decoded Player Data: " + JSON.stringify(playerData));
    console.log("Decoded UUID: " + uuid);
}




self.addEventListener('message', (event) => {
    const data = event.data;

    if (data.type === "nS") {
        console.log("Switching to " + data.url);
        initWebSocket(data.url);
    } else if (data.type === "m") {
        sendMoveData(data.f);
    } else if (data.type === "d") {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.onclose = () => { };
            socket.send(JSON.stringify({ uuid: playerUUID, type: "disconnect" }));
            socket.close();
        }
    } else if (data.type === "k") {
        const newKeypress = new $BOOLBYTE();
        for (let i = 0; i < data.k.length; i++) {
            newKeypress.set(i, data.k[i] == "1" ? true : false);
        }
        keypress = newKeypress;
    }
});

function generate4ByteUUID() {
    const hexValue = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0');

    const binaryString = hexToBinary(hexValue);

    const uint8Array = binaryStringToUint8Array(binaryString);

    return uint8Array;
}

function hexToBinary(hexString) {
    const decimalValue = parseInt(hexString, 16);

    const binaryString = decimalValue.toString(2).padStart(32, '0'); // 32 bits for a 4-byte UUID

    return binaryString;
}

function binaryStringToUint8Array(binaryString) {
    const uint8Array = new Uint8Array(4);

    for (let i = 0; i < 4; i++) {
        const byteString = binaryString.substring(i * 8, (i + 1) * 8);

        uint8Array[i] = parseInt(byteString, 2);
    }

    return uint8Array;
}

setInterval(() => {
    self.postMessage({ "type": "keypresses" })
    getPlayerData()
}, 1000 / 60)