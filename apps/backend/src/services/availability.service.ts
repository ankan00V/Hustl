import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';

export interface AvailabilitySlot {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startHour: number; // 0-23
  endHour: number; // 0-23
}

/**
 * Availability Service
 * Manages student availability scheduling
 */
export class AvailabilityService {
  /**
   * Validate availability slot format
   */
  private validateSlot(slot: AvailabilitySlot): void {
    if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
      throw new AppError(400, 'dayOfWeek must be between 0 (Sunday) and 6 (Saturday)');
    }

    if (slot.startHour < 0 || slot.startHour > 23) {
      throw new AppError(400, 'startHour must be between 0 and 23');
    }

    if (slot.endHour < 0 || slot.endHour > 23) {
      throw new AppError(400, 'endHour must be between 0 and 23');
    }

    if (slot.startHour >= slot.endHour) {
      throw new AppError(400, 'startHour must be less than endHour');
    }
  }

  /**
   * Update student availability slots
   */
  async updateAvailability(studentId: string, slots: AvailabilitySlot[]): Promise<void> {
    // Validate all slots
    slots.forEach((slot) => this.validateSlot(slot));

    // Convert to JSON strings for storage
    const slotStrings = slots.map((slot) => JSON.stringify(slot));

    await prisma.studentProfile.update({
      where: { userId: studentId },
      data: {
        availabilitySlots: slotStrings,
      },
    });
  }

  /**
   * Get student availability slots
   */
  async getAvailability(studentId: string): Promise<AvailabilitySlot[]> {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: studentId },
      select: { availabilitySlots: true },
    });

    if (!profile) {
      throw new AppError(404, 'Student profile not found');
    }

    // Parse JSON strings back to objects
    return profile.availabilitySlots.map((slot) => JSON.parse(slot) as AvailabilitySlot);
  }

  /**
   * Check if a listing time falls within student's availability
   * Returns a score: 1.0 if available, 0.3 if not (penalty but not hard-exclude)
   */
  calculateAvailabilityScore(
    listingStartTime: Date,
    availabilitySlots: AvailabilitySlot[]
  ): number {
    // If no availability slots set, assume always available
    if (availabilitySlots.length === 0) {
      return 1.0;
    }

    const dayOfWeek = listingStartTime.getDay(); // 0-6
    const hour = listingStartTime.getHours(); // 0-23

    // Check if listing time falls within any availability slot
    const isAvailable = availabilitySlots.some((slot) => {
      return (
        slot.dayOfWeek === dayOfWeek &&
        hour >= slot.startHour &&
        hour < slot.endHour
      );
    });

    return isAvailable ? 1.0 : 0.3; // 0.3 penalty if outside availability
  }

  /**
   * Get availability overlap score for a specific listing
   * Used in deck ranking
   */
  async getListingAvailabilityScore(
    studentId: string,
    listingStartTime: Date
  ): Promise<number> {
    const slots = await this.getAvailability(studentId);
    return this.calculateAvailabilityScore(listingStartTime, slots);
  }

  /**
   * Check if student is available for urgent listing
   * Urgent mode bypasses availability de-ranking
   */
  async isAvailableForUrgent(studentId: string): Promise<boolean> {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: studentId },
      select: { urgentOptIn: true },
    });

    return profile?.urgentOptIn ?? false;
  }

  /**
   * Toggle urgent opt-in preference
   */
  async updateUrgentOptIn(studentId: string, optIn: boolean): Promise<void> {
    await prisma.studentProfile.update({
      where: { userId: studentId },
      data: { urgentOptIn: optIn },
    });
  }

  /**
   * Get formatted availability for display
   * Returns human-readable schedule
   */
  async getFormattedAvailability(studentId: string): Promise<string[]> {
    const slots = await this.getAvailability(studentId);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return slots.map((slot) => {
      const day = dayNames[slot.dayOfWeek];
      const start = this.formatHour(slot.startHour);
      const end = this.formatHour(slot.endHour);
      return `${day}: ${start} - ${end}`;
    });
  }

  /**
   * Format hour as 12-hour time
   */
  private formatHour(hour: number): string {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
  }

  /**
   * Get availability conflicts for a listing
   * Returns students who are NOT available at the listing time
   */
  async getUnavailableStudents(listingStartTime: Date, studentIds: string[]): Promise<string[]> {
    const unavailable: string[] = [];

    for (const studentId of studentIds) {
      const score = await this.getListingAvailabilityScore(studentId, listingStartTime);
      if (score < 1.0) {
        unavailable.push(studentId);
      }
    }

    return unavailable;
  }
}

export const availabilityService = new AvailabilityService();
