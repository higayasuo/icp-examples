import { describe, it, expect } from 'vitest';
import { ICPWorker, MessageType } from '../ICPWorker';

describe('ICPWorker', () => {
  it('should handle unknown message type with error', async () => {
    const worker = new ICPWorker();
    const message = {
      type: MessageType.OTHER,
      data: 'test',
    };

    const response = await worker.postMessage(message);

    expect(response.type).toBe(MessageType.OTHER);
    expect(response.data).toBeNull();
    expect(response.error).toBe(`Unknown message type: ${MessageType.OTHER}`);
  });
});
