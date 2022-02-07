const protobufjs = require('protobufjs');

let tiktokSchemaPath = require.resolve('../prototypes/tiktokSchema.proto');
let tiktokSchema = null;

// load & cache schema
function loadTikTokSchema() {
    if (!tiktokSchema) {
        tiktokSchema = protobufjs.loadSync(tiktokSchemaPath);
    } 
}

function serializeMessage(protoName, obj) {
    loadTikTokSchema();
    return tiktokSchema.lookupType(`TikTok.${protoName}`).encode(obj).finish();
}

function deserializeMessage(protoName, binaryMessage) {
    loadTikTokSchema();

    var webcastData = tiktokSchema.lookupType(`TikTok.${protoName}`).decode(binaryMessage);

    if (protoName === 'WebcastResponse' && Array.isArray(webcastData.messages)) {
        // contains different object structures depending on the type field
        webcastData.messages.forEach(message => {
            switch (message.type) {
                case 'WebcastControlMessage':
                    message.decodedData = tiktokSchema.lookupType("TikTok.WebcastControlMessage").decode(message.binary);
                    break
                case 'WebcastRoomUserSeqMessage':
                    message.decodedData = tiktokSchema.lookupType("TikTok.WebcastRoomUserSeqMessage").decode(message.binary);
                    break    
                case 'WebcastChatMessage':
                    message.decodedData = tiktokSchema.lookupType("TikTok.WebcastChatMessage").decode(message.binary);
                    break
                case 'WebcastMemberMessage':
                    message.decodedData = tiktokSchema.lookupType("TikTok.WebcastMemberMessage").decode(message.binary);
                    break  
                case 'WebcastGiftMessage':
                    message.decodedData = tiktokSchema.lookupType("TikTok.WebcastGiftMessage").decode(message.binary);
                    break                        
                default:
                    break
            }
        });
    }

    return webcastData;
}

function deserializeWebsocketMessage(binaryMessage) {
    // websocket messages are in an container which contains additional data
    // message type 'msg' represents a normal WebcastResponse
    let decodedWebsocketMessage = deserializeMessage("WebcastWebsocketMessage", binaryMessage);
    if(decodedWebsocketMessage.type === 'msg') {
        decodedWebsocketMessage.webcastResponse = deserializeMessage("WebcastResponse", decodedWebsocketMessage.binary);
    }

    return decodedWebsocketMessage;
}

module.exports = {
    serializeMessage,
    deserializeMessage,
    deserializeWebsocketMessage
}