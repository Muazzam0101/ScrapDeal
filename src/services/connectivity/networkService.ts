import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';

export type ConnectivityListener = (isOnline: boolean, state: NetInfoState) => void;

class NetworkService {
  private subscription: NetInfoSubscription | null = null;
  private listeners: Set<ConnectivityListener> = new Set();
  private _isOnline: boolean = true;
  private _simulatedOffline: boolean | null = null;
  private onOnlineCallback: (() => void) | null = null;

  constructor() {
    this.init();
  }

  private init() {
    this.subscription = NetInfo.addEventListener((state) => {
      this.handleStateChange(state);
    });

    // Initial check
    NetInfo.fetch().then((state) => {
      this.handleStateChange(state);
    });
  }

  private handleStateChange(state: NetInfoState) {
    if (this._simulatedOffline !== null) {
      return; // Simulation overrides real network
    }

    const wasOnline = this._isOnline;
    // Considered online if connected and internet is reachable (or null during initial check)
    const isOnlineNow = Boolean(state.isConnected && state.isInternetReachable !== false);

    this._isOnline = isOnlineNow;

    // Notify listeners
    this.listeners.forEach((listener) => {
      try {
        listener(isOnlineNow, state);
      } catch (err) {
        console.warn('[NetworkService] Listener error:', err);
      }
    });

    // Transition: OFFLINE -> ONLINE
    if (!wasOnline && isOnlineNow) {
      console.log('[NetworkService] Connection restored: OFFLINE -> ONLINE. Triggering sync.');
      if (this.onOnlineCallback) {
        this.onOnlineCallback();
      }
    }
  }

  /**
   * Registers a sync trigger callback to execute when internet returns.
   */
  setOnOnlineCallback(callback: () => void) {
    this.onOnlineCallback = callback;
  }

  /**
   * Current online status.
   */
  isOnline(): boolean {
    if (this._simulatedOffline !== null) {
      return !this._simulatedOffline;
    }
    return this._isOnline;
  }

  /**
   * Subscribe to network changes.
   */
  addListener(listener: ConnectivityListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Simulate offline or online state for testing and evaluation.
   */
  simulateConnectivity(isOnline: boolean | null) {
    const wasOnline = this.isOnline();
    this._simulatedOffline = isOnline === null ? null : !isOnline;
    const nowOnline = this.isOnline();

    console.log(`[NetworkService] Connectivity simulation set: online=${nowOnline}`);

    const simulatedState: any = {
      isConnected: nowOnline,
      isInternetReachable: nowOnline,
      type: nowOnline ? 'wifi' : 'none',
      details: null,
    };

    this.listeners.forEach((l) => l(nowOnline, simulatedState));

    if (!wasOnline && nowOnline) {
      console.log('[NetworkService] Simulation: OFFLINE -> ONLINE transition. Triggering sync.');
      if (this.onOnlineCallback) {
        this.onOnlineCallback();
      }
    }
  }

  destroy() {
    if (this.subscription) {
      this.subscription();
      this.subscription = null;
    }
    this.listeners.clear();
  }
}

export const networkService = new NetworkService();
