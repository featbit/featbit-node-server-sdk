import { WebSocketServer } from "ws";
import testData from "./bootstrap/featbit-bootstrap.json";

export function createEvaluationServerMock(): WebSocketServer {
  const wss = new WebSocketServer({
    port: 6100,
    perMessageDeflate: {
      zlibDeflateOptions: {
        // See zlib defaults.
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      // Other options settable:
      clientNoContextTakeover: true, // Defaults to negotiated value.
      serverNoContextTakeover: true, // Defaults to negotiated value.
      serverMaxWindowBits: 10, // Defaults to negotiated value.
      // Below options specified as default values.
      concurrencyLimit: 10, // Limits zlib concurrency for perf.
      threshold: 1024 // Size (in bytes) below which messages
      // should not be compressed if context takeover is disabled.
    }
  });

  wss.on('connection', function connection(ws) {
    ws.on('error', console.error);

    ws.on('message', function message(data) {
      const json = JSON.parse(data.toString());

      if (json.messageType === 'data-sync') {
        ws.send(JSON.stringify(testData));
        return;
      }

      if (json.messageType === 'ping') {
        ws.send(JSON.stringify({
          messageType: 'pong',
          data: null
        }));
        return;
      }
    });
  });

  return wss;
}