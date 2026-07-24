export interface BatteryInfo {
  level: number; // 0 to 100
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  isSupported: boolean;
}

export const LOW_BATTERY_THRESHOLD = 15;

/**
 * Reads the current device battery level using Web Battery Status API if supported.
 */
export async function getDeviceBatteryInfo(): Promise<BatteryInfo> {
  if (typeof window !== 'undefined' && 'getBattery' in navigator) {
    try {
      const battery = await (navigator as any).getBattery();
      return {
        level: Math.round(battery.level * 100),
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime,
        isSupported: true,
      };
    } catch (err) {
      console.warn('Battery Status API error or blocked:', err);
    }
  }

  return {
    level: 100,
    charging: false,
    chargingTime: 0,
    dischargingTime: 0,
    isSupported: false,
  };
}

/**
 * Checks if a given battery level is below the threshold (15%).
 */
export function checkBatteryLevel(
  level: number,
  charging = false,
  threshold = LOW_BATTERY_THRESHOLD
): {
  isLow: boolean;
  level: number;
  threshold: number;
  shouldNotify: boolean;
} {
  const isLow = level <= threshold;
  const shouldNotify = isLow && !charging;

  return {
    isLow,
    level,
    threshold,
    shouldNotify,
  };
}

/**
 * Listens to real-time battery level & charging changes if supported by browser.
 */
export function subscribeBatteryChanges(
  onUpdate: (info: BatteryInfo) => void
): () => void {
  let batteryObj: any = null;

  const handleUpdate = () => {
    if (batteryObj) {
      onUpdate({
        level: Math.round(batteryObj.level * 100),
        charging: batteryObj.charging,
        chargingTime: batteryObj.chargingTime,
        dischargingTime: batteryObj.dischargingTime,
        isSupported: true,
      });
    }
  };

  if (typeof window !== 'undefined' && 'getBattery' in navigator) {
    (navigator as any)
      .getBattery()
      .then((battery: any) => {
        batteryObj = battery;
        handleUpdate();

        battery.addEventListener('levelchange', handleUpdate);
        battery.addEventListener('chargingchange', handleUpdate);
      })
      .catch((err: any) => {
        console.warn('Could not attach battery change listeners:', err);
      });
  }

  return () => {
    if (batteryObj) {
      batteryObj.removeEventListener('levelchange', handleUpdate);
      batteryObj.removeEventListener('chargingchange', handleUpdate);
    }
  };
}
