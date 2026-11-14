import { adService } from "@/services/ad-service";
import { badgeService } from "@/services/badge-service";
import { benefitOverrideStore } from "@/services/benefit-admin-service";
import { businessService } from "@/services/business-service";
import { categoryService } from "@/services/category-service";
import { editRequestService } from "@/services/edit-request-service";
import { eventService } from "@/services/event-service";
import { appointmentStore, savedStore } from "@/services/member-service";
import { planService, subscriptionService } from "@/services/membership-service";
import { settingsService } from "@/services/settings-service";
import { userService } from "@/services/user-service";

/**
 * DEMO ONLY: restores every browser-stored collection to its seed data. The signed-in session is kept
 * (if that account no longer exists after the reset, the user is simply signed out).
 * Not part of the real API integration — delete when the demo stores are removed.
 */
export function resetAllDemoData() {
  businessService.reset();
  eventService.reset();
  categoryService.reset();
  userService.reset();
  settingsService.reset();
  planService.reset();
  subscriptionService.reset();
  editRequestService.reset();
  badgeService.reset();
  adService.reset();
  benefitOverrideStore.reset();
  savedStore.reset();
  appointmentStore.reset();
}
