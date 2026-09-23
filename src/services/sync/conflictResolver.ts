/**
 * Deterministic Last-Write-Wins (LWW) Conflict Resolver for Phase 2.
 *
 * Strategy:
 * 1. Each record maintains an ISO 8601 string `updatedAt`.
 * 2. When a local mutation is synchronized against a remote record:
 *    - If local `updatedAt` >= remote `updatedAt`: Local record wins, overwrite remote in Firestore.
 *    - If remote `updatedAt` > local `updatedAt`: Remote record wins, overwrite local record in SQLite.
 * 3. Never discard data if timestamps cannot be determined: local takes priority for uncommitted client edits.
 */

export interface TimestampedRecord {
  updatedAt?: string;
  createdAt?: string;
  [key: string]: any;
}

export type ConflictResolution = 'USE_LOCAL' | 'USE_REMOTE';

export const conflictResolver = {
  /**
   * Resolves conflict between local and remote versions of a record.
   */
  resolve<T extends TimestampedRecord>(localRecord: T, remoteRecord: T): ConflictResolution {
    const localTime = new Date(localRecord.updatedAt || localRecord.createdAt || 0).getTime();
    const remoteTime = new Date(remoteRecord.updatedAt || remoteRecord.createdAt || 0).getTime();

    if (localTime >= remoteTime) {
      return 'USE_LOCAL';
    } else {
      return 'USE_REMOTE';
    }
  },
};
