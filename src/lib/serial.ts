// Lightweight Web Serial helper for talking to Arduino from the browser
// Note: Works in Chromium-based browsers (Chrome/Edge). Must be served over HTTPS or localhost.

export type SerialStatus = "disconnected" | "connecting" | "connected" | "error";

class WebSerialController {
  private port: SerialPort | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private encoder = new TextEncoder();
  status: SerialStatus = "disconnected";
  lastError: unknown = null;
  private listeners: Array<(s: SerialStatus) => void> = [];

  get supported() {
    return typeof navigator !== "undefined" && "serial" in navigator;
  }

  onStatusChange(cb: (s: SerialStatus) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((f) => f !== cb);
    };
  }

  private setStatus(s: SerialStatus) {
    this.status = s;
    this.listeners.forEach((cb) => cb(s));
  }

  async requestPort(): Promise<SerialPort> {
    if (!this.supported) throw new Error("Web Serial not supported in this browser");
    // Let user select a port
    const port = await (navigator as any).serial.requestPort();
    this.port = port;
    return port;
  }

  async connect(options: { baudRate?: number } = {}): Promise<void> {
    if (!this.supported) throw new Error("Web Serial not supported in this browser");
    if (!this.port) throw new Error("No port selected. Call requestPort() first.");
    const baudRate = options.baudRate ?? 9600;
    try {
      this.setStatus("connecting");
      await this.port.open({ baudRate });
      const writable = (this.port as any).writable as WritableStream<Uint8Array> | null;
      if (!writable) throw new Error("Port is not writable");
      this.writer = writable.getWriter();
      this.setStatus("connected");
    } catch (err) {
      this.lastError = err;
      this.setStatus("error");
      throw err;
    }
  }

  async send(text: string): Promise<void> {
    if (this.status !== "connected" || !this.writer) throw new Error("Serial not connected");
    const data = this.encoder.encode(text);
    await this.writer.write(data);
  }

  async disconnect(): Promise<void> {
    try {
      if (this.writer) {
        try { await this.writer.close(); } catch {}
        try { this.writer.releaseLock(); } catch {}
      }
      if (this.port) {
        try { await this.port.close(); } catch {}
      }
    } finally {
      this.writer = null;
      this.port = null;
      this.setStatus("disconnected");
    }
  }
}

export const serial = new WebSerialController();

// Optional minimal ambient types if TS lib.dom lacks Web Serial in this environment
declare global {
  interface Navigator {
    serial?: {
      requestPort: () => Promise<SerialPort>;
    };
  }
  interface SerialPort {
    open: (options: { baudRate: number }) => Promise<void>;
    close: () => Promise<void>;
    readable?: ReadableStream<Uint8Array> | null;
    writable?: WritableStream<Uint8Array> | null;
  }
}
