/**
 * Client-Side End-to-End Encryption (E2EE) Utility for VocabFlow
 * 
 * Architecture:
 * - Hybrid Cryptosystem: RSA-OAEP (2048-bit SHA-256) + AES-GCM (256-bit)
 * - Zero-Knowledge Server: Plaintext messages and raw private keys NEVER leave the browser.
 * - PIN Protection: Private key is encrypted locally with AES-GCM using a key derived
 *   from a 6-digit user PIN via PBKDF2 (100,000 iterations, SHA-256).
 * - Multi-device support: The encrypted private key blob + salt is synced to server,
 *   so the student can unlock on another browser simply by entering their PIN.
 */

// Helper base64 encoding / decoding
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// In-memory cache of the unlocked RSA private key (never persisted to disk!)
let inMemoryPrivateKey: CryptoKey | null = null;
let currentUnlockedUserId: string | null = null;

export class E2EEService {
  /**
   * Derive an AES-GCM key from user PIN using PBKDF2
   */
  private static async deriveKeyFromPin(pin: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const pinKeyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(pin),
      'PBKDF2',
      false,
      ['deriveKey'],
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      pinKeyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  /**
   * Generate brand new E2EE Key Pair, encrypt private key with PIN, return registration payload
   */
  static async setupUserKeys(userId: string, pin: string) {
    // 1. Generate RSA-OAEP Key Pair
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt'],
    );

    // 2. Export Public Key as SPKI Base64
    const spki = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
    const publicKeyBase64 = bufferToBase64(spki);

    // 3. Export Private Key as PKCS8
    const pkcs8 = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    // 4. Derive AES-GCM key from PIN
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const pinDerivedKey = await this.deriveKeyFromPin(pin, salt);

    // 5. Encrypt Private Key with AES-GCM
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedPkcs8 = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      pinDerivedKey,
      pkcs8,
    );

    // Combine IV (12 bytes) + encrypted private key
    const combined = new Uint8Array(iv.length + encryptedPkcs8.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedPkcs8), iv.length);

    const encryptedPrivateKeyBase64 = bufferToBase64(combined);
    const saltBase64 = bufferToBase64(salt);

    // Cache private key in memory for immediate active use
    inMemoryPrivateKey = keyPair.privateKey;
    currentUnlockedUserId = userId;

    return {
      publicKey: publicKeyBase64,
      encryptedPrivateKey: encryptedPrivateKeyBase64,
      keyDerivationSalt: saltBase64,
      keyAlgorithm: 'RSA-OAEP-2048-PBKDF2',
    };
  }

  /**
   * Unlock private key using PIN
   */
  static async unlockPrivateKeyWithPin(
    userId: string,
    pin: string,
    encryptedPrivateKeyBase64: string,
    saltBase64: string,
  ): Promise<boolean> {
    try {
      const salt = new Uint8Array(base64ToBuffer(saltBase64));
      const combined = new Uint8Array(base64ToBuffer(encryptedPrivateKeyBase64));

      // Extract IV (first 12 bytes) and ciphertext
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);

      const pinDerivedKey = await this.deriveKeyFromPin(pin, salt);

      const decryptedPkcs8 = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        pinDerivedKey,
        ciphertext,
      );

      const privateKey = await window.crypto.subtle.importKey(
        'pkcs8',
        decryptedPkcs8,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        false,
        ['decrypt'],
      );

      inMemoryPrivateKey = privateKey;
      currentUnlockedUserId = userId;
      return true;
    } catch (err) {
      console.error('Failed to unlock private key (wrong PIN or corrupted data):', err);
      return false;
    }
  }

  /**
   * Check if user's E2EE session is currently unlocked
   */
  static isUnlocked(userId: string): boolean {
    return inMemoryPrivateKey !== null && currentUnlockedUserId === userId;
  }

  /**
   * Lock session (clear in-memory private key)
   */
  static lockSession() {
    inMemoryPrivateKey = null;
    currentUnlockedUserId = null;
  }

  /**
   * Encrypt a message payload for multiple participants (Sender + Recipient)
   */
  static async encryptMessage(
    plaintext: string,
    recipientPublicKeyBase64: string,
    recipientUserId: string,
    senderPublicKeyBase64: string,
    senderUserId: string,
  ) {
    // 1. Generate random AES-GCM 256-bit session key
    const sessionKey = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );

    // 2. Encrypt plaintext message with AES-GCM
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encryptedMessage = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      sessionKey,
      enc.encode(plaintext),
    );

    // 3. Export raw AES session key
    const rawSessionKey = await window.crypto.subtle.exportKey('raw', sessionKey);

    // 4. Import recipient & sender public keys
    const recipientPubKey = await window.crypto.subtle.importKey(
      'spki',
      base64ToBuffer(recipientPublicKeyBase64),
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt'],
    );

    const senderPubKey = await window.crypto.subtle.importKey(
      'spki',
      base64ToBuffer(senderPublicKeyBase64),
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt'],
    );

    // 5. Encrypt AES key for each participant
    const encryptedKeyRecipient = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      recipientPubKey,
      rawSessionKey,
    );

    const encryptedKeySender = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      senderPubKey,
      rawSessionKey,
    );

    return {
      ciphertext: bufferToBase64(encryptedMessage),
      iv: bufferToBase64(iv),
      encryptedKeys: {
        [recipientUserId]: bufferToBase64(encryptedKeyRecipient),
        [senderUserId]: bufferToBase64(encryptedKeySender),
      },
    };
  }

  /**
   * Decrypt a message using in-memory unlocked private key
   */
  static async decryptMessage(
    userId: string,
    ciphertextBase64: string,
    ivBase64: string,
    encryptedKeys: Record<string, string>,
  ): Promise<string> {
    if (!this.isUnlocked(userId) || !inMemoryPrivateKey) {
      return '🔒 [Nội dung mã hóa - Nhập mã PIN để xem]';
    }

    const encryptedKeyForUser = encryptedKeys[userId];
    if (!encryptedKeyForUser) {
      return '⚠️ [Không tìm thấy khóa mã hóa cho người nhận này]';
    }

    try {
      // 1. Decrypt raw AES key using unlocked private key
      const rawSessionKey = await window.crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        inMemoryPrivateKey,
        base64ToBuffer(encryptedKeyForUser),
      );

      // 2. Import raw AES key
      const sessionKey = await window.crypto.subtle.importKey(
        'raw',
        rawSessionKey,
        { name: 'AES-GCM' },
        false,
        ['decrypt'],
      );

      // 3. Decrypt ciphertext
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(base64ToBuffer(ivBase64)) },
        sessionKey,
        base64ToBuffer(ciphertextBase64),
      );

      const dec = new TextDecoder();
      return dec.decode(decryptedBuffer);
    } catch (err) {
      console.error('Decryption failed:', err);
      return '⚠️ [Lỗi giải mã tin nhắn]';
    }
  }
}
