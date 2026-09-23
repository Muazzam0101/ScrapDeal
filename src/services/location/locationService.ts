import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationPermissionResult {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus;
}

export const locationService = {
  /**
   * Requests device location permission with clear user-facing rationale.
   */
  async requestPermissions(): Promise<LocationPermissionResult> {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      return {
        granted: status === Location.PermissionStatus.GRANTED,
        canAskAgain,
        status,
      };
    } catch (error) {
      console.warn('[LocationService] Permission request failed:', error);
      return {
        granted: false,
        canAskAgain: true,
        status: Location.PermissionStatus.DENIED,
      };
    }
  },

  /**
   * Checks current permission status without prompting.
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === Location.PermissionStatus.GRANTED;
    } catch {
      return false;
    }
  },

  /**
   * Retrieves the current device location accurately.
   */
  async getCurrentCoordinates(): Promise<Coordinates | null> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        const { granted } = await this.requestPermissions();
        if (!granted) return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (error) {
      console.warn('[LocationService] Unable to obtain current position:', error);
      return null;
    }
  },

  /**
   * Coarse/approximate location derived by truncating coordinates to ~1-2km precision.
   * Protects collector privacy: exact residential coordinates are never exposed.
   */
  getApproximateCoordinates(coords: Coordinates): Coordinates {
    return {
      latitude: Math.round(coords.latitude * 100) / 100,
      longitude: Math.round(coords.longitude * 100) / 100,
    };
  },

  /**
   * Calculates the real geographic distance between two coordinates in kilometers using Haversine formula.
   */
  calculateDistanceKm(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371; // Earth's mean radius in km
    const dLat = this.deg2rad(point2.latitude - point1.latitude);
    const dLon = this.deg2rad(point2.longitude - point1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(point1.latitude)) *
        Math.cos(this.deg2rad(point2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // 1 decimal place e.g. 3.4 km
  },

  formatDistance(distanceKm?: number | null): string {
    if (distanceKm === undefined || distanceKm === null || isNaN(distanceKm)) {
      return 'दूरी अनुपलब्ध (Distance unavailable)';
    }
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m away`;
    }
    return `${distanceKm.toFixed(1)} km away`;
  },

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  },
};
