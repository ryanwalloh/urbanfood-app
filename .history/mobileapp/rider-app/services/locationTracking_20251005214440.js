// Real-time Rider Location Tracking Service
import * as Location from 'expo-location';

class LocationTrackingService {
  constructor() {
    this.isTracking = false;
    this.pollingInterval = null;
    this.lastKnownLocation = null;
    this.trackingOrderId = null;
    
    // Configuration
    this.POLLING_INTERVAL = 20000; // 20 seconds (optimal for delivery)
    this.MOVEMENT_THRESHOLD = 0.0001; // ~10 meters threshold
    this.ACCURACY_THRESHOLD = 100; // Only accept locations within 100m accuracy
    
    // Callbacks
    this.onLocationUpdate = null;
    this.onError = null;
  }

  /**
   * Start real-time location tracking for an order
   * @param {string} orderId - The order being tracked
   * @param {Function} onLocationUpdate - Callback when location is updated
   * @param {Function} onError - Callback for errors
   */
  startTracking(orderId, onLocationUpdate = null, onError = null) {
    if (this.isTracking) {
      console.log('⚠️ Location tracking already active');
      return;
    }

    this.trackingOrderId = orderId;
    this.onLocationUpdate = onLocationUpdate;
    this.onError = onError;
    this.isTracking = true;

    console.log('🚀 Starting real-time location tracking for order:', orderId);
    console.log('📊 Polling interval:', this.POLLING_INTERVAL / 1000, 'seconds');
    console.log('📏 Movement threshold:', this.MOVEMENT_THRESHOLD);

    // Start immediate location capture
    this.captureLocation();

    // Set up polling
    this.pollingInterval = setInterval(() => {
      this.captureLocation();
    }, this.POLLING_INTERVAL);
  }

  /**
   * Stop real-time location tracking
   */
  stopTracking() {
    if (!this.isTracking) {
      return;
    }

    console.log('🛑 Stopping real-time location tracking');
    
    this.isTracking = false;
    this.trackingOrderId = null;
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    // Clear callbacks
    this.onLocationUpdate = null;
    this.onError = null;
  }

  /**
   * Capture current location and check for movement
   */
  async captureLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Balanced for better battery life
        timeInterval: 5000, // 5 second timeout
      });

      const { latitude, longitude, accuracy } = location.coords;

      // Check accuracy threshold
      if (accuracy > this.ACCURACY_THRESHOLD) {
        console.log('⚠️ Location accuracy too low:', accuracy, 'meters');
        return;
      }

      const currentLocation = { latitude, longitude };

      // Check for significant movement
      const hasMoved = this.hasSignificantMovement(currentLocation);

      if (hasMoved) {
        console.log('📍 Significant movement detected:', {
          from: this.lastKnownLocation,
          to: currentLocation,
          accuracy: accuracy + 'm'
        });

        // Update last known location
        this.lastKnownLocation = currentLocation;

        // Call update callback
        if (this.onLocationUpdate) {
          this.onLocationUpdate(currentLocation, {
            accuracy,
            orderId: this.trackingOrderId,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        console.log('📍 No significant movement detected, skipping update');
      }

    } catch (error) {
      console.log('❌ Location capture error:', error);
      
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  /**
   * Check if there's significant movement between locations
   * @param {Object} newLocation - New location coordinates
   * @returns {boolean} - True if significant movement detected
   */
  hasSignificantMovement(newLocation) {
    if (!this.lastKnownLocation) {
      return true; // First location is always considered movement
    }

    // Calculate distance using Haversine formula (simplified)
    const distance = this.calculateDistance(
      this.lastKnownLocation.latitude,
      this.lastKnownLocation.longitude,
      newLocation.latitude,
      newLocation.longitude
    );

    console.log('📏 Distance from last location:', distance.toFixed(2), 'meters');

    return distance > (this.MOVEMENT_THRESHOLD * 111000); // Convert to meters
  }

  /**
   * Calculate distance between two coordinates in meters
   * Using simplified Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }

  /**
   * Update tracking configuration
   */
  updateConfig(config) {
    if (config.pollingInterval) {
      this.POLLING_INTERVAL = config.pollingInterval;
    }
    if (config.movementThreshold) {
      this.MOVEMENT_THRESHOLD = config.movementThreshold;
    }
    if (config.accuracyThreshold) {
      this.ACCURACY_THRESHOLD = config.accuracyThreshold;
    }

    console.log('⚙️ Location tracking config updated:', config);
  }

  /**
   * Get current tracking status
   */
  getStatus() {
    return {
      isTracking: this.isTracking,
      orderId: this.trackingOrderId,
      lastKnownLocation: this.lastKnownLocation,
      pollingInterval: this.POLLING_INTERVAL,
      movementThreshold: this.MOVEMENT_THRESHOLD,
      accuracyThreshold: this.ACCURACY_THRESHOLD
    };
  }
}

// Export singleton instance
export const locationTracker = new LocationTrackingService();
