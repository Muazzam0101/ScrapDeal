import { TraceabilityStatus } from '../../types';

/**
 * Valid allowed state transitions in ScrapDeal chain of custody.
 * Prevents illegal skips (e.g., collected -> completed).
 */
const ALLOWED_TRANSITIONS: Record<TraceabilityStatus, TraceabilityStatus[]> = {
  created: ['collected', 'cancelled'],
  collected: ['matched', 'deal_confirmed', 'cancelled'],
  matched: ['deal_confirmed', 'cancelled'],
  deal_confirmed: ['handover_pending', 'cancelled'],
  handover_pending: ['handover_confirmed', 'cancelled'],
  handover_confirmed: ['payment_pending', 'cancelled'],
  payment_pending: ['completed', 'cancelled'],
  completed: [], // Terminal state: cannot transition out
  cancelled: [], // Terminal state: cannot transition out
};

export class InvalidStateTransitionError extends Error {
  public readonly currentStatus: TraceabilityStatus;
  public readonly targetStatus: TraceabilityStatus;

  constructor(currentStatus: TraceabilityStatus, targetStatus: TraceabilityStatus) {
    super(
      `अवैध स्थिति परिवर्तन (Invalid state transition from '${currentStatus}' to '${targetStatus}'). Chain of custody order must be strictly preserved.`
    );
    this.name = 'InvalidStateTransitionError';
    this.currentStatus = currentStatus;
    this.targetStatus = targetStatus;
  }
}

export const traceabilityStateMachine = {
  /**
   * Checks whether transitioning from currentStatus to targetStatus is legally permitted.
   */
  canTransition(currentStatus: TraceabilityStatus, targetStatus: TraceabilityStatus): boolean {
    if (currentStatus === targetStatus) {
      return true; // Idempotent no-op
    }
    const allowedTargets = ALLOWED_TRANSITIONS[currentStatus] || [];
    return allowedTargets.includes(targetStatus);
  },

  /**
   * Validates and asserts that a state transition is legal.
   * Throws InvalidStateTransitionError if illegal.
   */
  assertValidTransition(currentStatus: TraceabilityStatus, targetStatus: TraceabilityStatus): void {
    if (!this.canTransition(currentStatus, targetStatus)) {
      throw new InvalidStateTransitionError(currentStatus, targetStatus);
    }
  },

  /**
   * Returns list of valid next statuses from current status.
   */
  getNextValidStatuses(currentStatus: TraceabilityStatus): TraceabilityStatus[] {
    return ALLOWED_TRANSITIONS[currentStatus] || [];
  },
};
