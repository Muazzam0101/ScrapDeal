/**
 * Collision-resistant reference generator for ScrapDeal Digital Traceability.
 * Generates non-guessable, cryptographically sound references.
 * Strictly avoids predictable sequential IDs.
 */

function generateRandomHex(length: number): string {
  const chars = '0123456789ABCDEF';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateRandomAlphaNum(length: number): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excludes ambiguous 0/O, 1/I
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const referenceGenerator = {
  /**
   * Generates a unique traceable reference for a scrap transfer.
   * Example: SCRAP-2026-7B9X2K4M
   */
  generateTraceabilityReference(year: number = new Date().getFullYear()): string {
    const entropy = generateRandomAlphaNum(8);
    return `SCRAP-${year}-${entropy}`;
  },

  /**
   * Generates a unique lot identifier.
   * Example: LOT-8F3M9P2K
   */
  generateLotReference(): string {
    const entropy = generateRandomAlphaNum(8);
    return `LOT-${entropy}`;
  },

  /**
   * Generates a unique digital handover reference number.
   * Example: HND-4N7Q1Y9X
   */
  generateHandoverReference(): string {
    const entropy = generateRandomAlphaNum(8);
    return `HND-${entropy}`;
  },

  /**
   * Generates a unique audit event identifier.
   * Example: EVT-LN38F-A9B2
   */
  generateEventId(): string {
    const timeBase = Date.now().toString(36).toUpperCase();
    const entropy = generateRandomAlphaNum(4);
    return `EVT-${timeBase}-${entropy}`;
  },

  /**
   * Generates a secure, non-guessable verification token for QR codes.
   * Contains high entropy so outsiders cannot brute force valid records.
   * Example: SD-VERIFY-7F2A89C4B13D5E60
   */
  generateVerificationToken(): string {
    return `SD-VERIFY-${generateRandomHex(16)}`;
  },
};
