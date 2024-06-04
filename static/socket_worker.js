let socket;
const pingInterval = 20;
const playerUUID = generate4ByteUUID();
let pingStartTime = 0;
let ping1 = 0;
const LEVEL_DATA_TIMEOUT = 5000;
var fullMoveBinarySend = new Uint8Array(5)

class $BOOLBYTE {
    uint = new Uint8Array(new ArrayBuffer(1))
    constructor () {
        for (var i = 0; i < 7; i++) {
            this.uint[0] |= (0 << i) 
        }
    }
    set(index, bool) {
        if (bool) {
            this.uint[0] |= (1 << index);
        } else {
            this.uint[0] &= ~(1 << index);
        }
    }
  }
  


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
        var da = new Uint8Array(5)
        var asd = new $BOOLBYTE();
        asd.set(0, true)
        asd.set(1, true)
        asd.set(2, true)
        asd.set(3, true)
        da[0] = asd.uint[0]
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
    const parsed = JSON.parse(event.data);

    if (parsed.type === "p") {
        ping1 = Date.now() - pingStartTime;
        postMessage({ type: 'data', data: parsed.p, ping: ping1 });
        getPlayerData()

    } else if (parsed.type === "c") {
        postMessage({ type: "playerCount", count: parsed.count });
    }

}

setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "playerCount" }));
    }
}, 1000);

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

