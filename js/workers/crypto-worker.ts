// Crypto Worker - 独立文件，避免 CSP 需要 blob: 权限
const PBKDF2_ITERATIONS = 600000;

self.onmessage = async (e: MessageEvent) => {
  const { requestId, type, password, salt, iv, data } = e.data || {};
  const enc = new TextEncoder();

  const reply = (payload: Record<string, any>, transfer?: Transferable[]) => {
    if (requestId !== undefined) payload.requestId = requestId;
    (self as any).postMessage(payload, transfer || []);
  };

  let passwordBuffer: Uint8Array | null = null;

  try {
    if (type === 'deriveKey') {
      passwordBuffer = enc.encode(password);
      const baseKey = await crypto.subtle.importKey('raw', passwordBuffer as any, 'PBKDF2', false, ['deriveKey']);
      await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: salt as any, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      reply({ type: 'key_derived' });
    } else if (type === 'encrypt') {
      passwordBuffer = enc.encode(password);
      const baseKey = await crypto.subtle.importKey('raw', passwordBuffer as any, 'PBKDF2', false, ['deriveKey']);
      const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: salt as any, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
      reply({ type: 'encrypted', ciphertext }, [ciphertext]);
    } else if (type === 'decrypt') {
      passwordBuffer = enc.encode(password);
      const baseKey = await crypto.subtle.importKey('raw', passwordBuffer as any, 'PBKDF2', false, ['deriveKey']);
      const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: salt as any, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
      reply({ type: 'decrypted', data: decrypted }, [decrypted]);
    }
  } catch (err: any) {
    reply({ type: 'error', error: type === 'decrypt' ? '解密失败' : (err?.message || '未知错误') });
  } finally {
    if (passwordBuffer) {
      try { passwordBuffer.fill(0); } catch { /* ignore */ }
    }
  }
};
