import { useEffect, useState } from 'react';
import { formatDateTime } from './format';

/**
 * Computes real-time lifecycle status of a corporate ride:
 * - 'CANCELLED': explicitly cancelled by driver
 * - 'COMPLETED': trip completed
 * - 'STARTED': ride currently in progress
 * - 'EXPIRED': departure time has passed and ride is closed
 * - 'FULL': all seats are booked
 * - 'ACTIVE': upcoming, bookable ride
 */
export function getRideStatus(ride, now = Date.now()) {
  if (!ride) return 'EXPIRED';

  const rawStatus = (ride.status || '').toUpperCase();
  if (rawStatus === 'CANCELLED' || rawStatus === 'REJECTED') return 'CANCELLED';
  if (rawStatus === 'COMPLETED' || rawStatus === 'FINISHED') return 'COMPLETED';
  if (rawStatus === 'STARTED' || rawStatus === 'IN_PROGRESS') return 'STARTED';

  if (!ride.departureTime) return 'ACTIVE';
  const depTime = new Date(ride.departureTime).getTime();
  if (Number.isNaN(depTime)) return 'ACTIVE';

  if (depTime <= now) {
    return 'EXPIRED';
  }

  if (Number(ride.availableSeats ?? 1) <= 0) {
    return 'FULL';
  }

  return 'ACTIVE';
}

/**
 * Returns true if the ride's departure time has passed.
 */
export function isRideExpired(ride, now = Date.now()) {
  if (!ride?.departureTime) return false;
  const depTime = new Date(ride.departureTime).getTime();
  if (Number.isNaN(depTime)) return false;
  return depTime <= now || (ride.status || '').toUpperCase() === 'EXPIRED';
}

/**
 * Calculates live time remaining until departure and formatting metadata for UI badges.
 */
export function getRideTimeRemaining(departureTime, now = Date.now()) {
  if (!departureTime) {
    return {
      isExpired: false,
      diffMs: 0,
      label: 'Scheduled',
      shortLabel: 'Scheduled',
      badgeVariant: 'neutral',
      badgeIcon: 'calendar-outline',
      icon: 'calendar-outline',
    };
  }

  const depMs = new Date(departureTime).getTime();
  if (Number.isNaN(depMs)) {
    return {
      isExpired: false,
      diffMs: 0,
      label: String(departureTime),
      shortLabel: 'Scheduled',
      badgeVariant: 'neutral',
      badgeIcon: 'time-outline',
      icon: 'time-outline',
    };
  }

  const diffMs = depMs - now;

  if (diffMs <= 0) {
    const elapsedMins = Math.floor(Math.abs(diffMs) / 60000);
    const elapsedLabel =
      elapsedMins < 60
        ? `Departed ${elapsedMins}m ago`
        : `Departed ${Math.floor(elapsedMins / 60)}h ago`;

    return {
      isExpired: true,
      diffMs,
      label: elapsedLabel,
      shortLabel: 'Departed',
      badgeVariant: 'neutral',
      badgeIcon: 'close-circle-outline',
      icon: 'close-circle-outline',
    };
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Under 15 minutes: Urgent/closing soon
  if (totalMinutes < 15) {
    return {
      isExpired: false,
      diffMs,
      label: `Departs in ${totalMinutes}m • Boarding Soon`,
      shortLabel: `${totalMinutes}m left`,
      badgeVariant: 'red',
      badgeIcon: 'alarm-outline',
      icon: 'alarm-outline',
    };
  }

  // Under 60 minutes
  if (totalMinutes < 60) {
    return {
      isExpired: false,
      diffMs,
      label: `Departs in ${totalMinutes}m`,
      shortLabel: `${totalMinutes}m left`,
      badgeVariant: 'amber',
      badgeIcon: 'time-outline',
      icon: 'time-outline',
    };
  }

  // Under 24 hours
  if (hours < 24) {
    const timeStr = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    return {
      isExpired: false,
      diffMs,
      label: `Departs in ${timeStr}`,
      shortLabel: `in ${timeStr}`,
      badgeVariant: 'green',
      badgeIcon: 'time-outline',
      icon: 'time-outline',
    };
  }

  // Greater than 24 hours
  const days = Math.floor(hours / 24);
  return {
    isExpired: false,
    diffMs,
    label: `Departs in ${days}d`,
    shortLabel: `in ${days}d`,
    badgeVariant: 'blue',
    badgeIcon: 'calendar-outline',
    icon: 'calendar-outline',
  };
}

/**
 * Hook providing a live timestamp that ticks every intervalMs (default 15s).
 * Causes screens to automatically re-render countdowns and expiration states in real time.
 */
export function useRideTicker(intervalMs = 15000) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}

/**
 * Filters a list of rides to exclude expired, cancelled, or finished rides.
 */
export function filterActiveRides(rides, now = Date.now()) {
  if (!Array.isArray(rides)) return [];
  return rides.filter((ride) => !isRideExpired(ride, now));
}
