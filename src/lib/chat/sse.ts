const encoder = new TextEncoder();

export function sseDataLine(obj: unknown): Uint8Array {
    return encoder.encode(`data: ${JSON.stringify(obj)}\n\n`);
}
