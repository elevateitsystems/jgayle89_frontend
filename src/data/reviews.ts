// Explicit extension so the data-integrity tests can run under plain `node --test`.
import { businesses } from "./businesses.ts";
import type { Review } from "@/types";

/**
 * DEMO DATA — sample reviews left on the Mission: SITREP website. Every reviewer
 * and review is fictional. These are a *sample* of the latest reviews; the total
 * count and average shown to users come from Business.rating / Business.reviewCount.
 */
type Row = [author: string, rating: number, date: string, title: string, body: string];

const rows: Record<string, Row[]> = {
  "ironwood-coffee-roasters": [
    ["Marcus T.", 5, "2026-10-14", "Best pour-over in town", "The Reveille blend is smooth and the Friday veteran crowd makes it feel like a second living room. Baristas remember my order."],
    ["Dana R.", 5, "2026-09-02", "Great wholesale partner", "We switched our office to Ironwood beans and the team noticed immediately. Delivery is always on schedule."],
    ["Chris P.", 4, "2026-07-21", "Busy but worth it", "Lines get long on Saturday mornings, but the coffee and the service are consistently good."],
  ],
  "summit-rally-brewing": [
    ["Jordan K.", 5, "2026-10-30", "Patio views and great lagers", "Twelve taps, all well kept. The smoked brisket plate pairs perfectly with the amber."],
    ["Alicia M.", 4, "2026-09-18", "Fun trivia night", "Staff were friendly and the room was lively. Parking is tight on event nights."],
    ["Ben W.", 4, "2026-08-05", "Solid taproom", "Beer quality is excellent. Food menu is short but everything we tried was good."],
  ],
  "fieldstone-bakehouse": [
    ["Priya S.", 5, "2026-10-22", "Sourdough worth the early wake-up", "Loaves sell out by noon for good reason. The crust is perfect."],
    ["Tom H.", 5, "2026-08-29", "Wedding cake was perfect", "They handled our custom order calmly and it tasted as good as it looked."],
    ["Renee L.", 4, "2026-06-11", "Lovely pastries", "The morning buns are the standout. Wish they opened a little earlier on weekdays."],
  ],
  "oak-and-anchor-kitchen": [
    ["Gabe F.", 5, "2026-10-09", "Dinner done right", "Great service and a menu that feels thought out. The braised short rib was excellent."],
    ["Nicole D.", 4, "2026-08-14", "Reliable and welcoming", "Good for groups. Wait times were long on a Friday, but the staff kept us updated."],
    ["Sam V.", 4, "2026-05-30", "Brunch favorite", "Generous portions and solid coffee. We will be back."],
  ],
  "bravo-company-builders": [
    ["Karen B.", 5, "2026-09-25", "Kitchen remodel finished on time", "Clear communication from estimate to final walk-through. The crew kept the site clean every day."],
    ["Luis A.", 5, "2026-07-08", "Honest pricing", "Came in right at the quote with no surprise change orders. Craftsmanship is top notch."],
    ["Heather N.", 4, "2026-04-17", "Good work, small delay", "A materials delay pushed us back a week, but they told us right away and made it right."],
  ],
  "sparkline-welding-fabrication": [
    ["Rick O.", 5, "2026-10-03", "Custom gate came out great", "Precise welds and a clean powder-coat finish. Delivered when promised."],
    ["Anita G.", 5, "2026-08-20", "Quick repair", "Fixed a broken trailer hitch the same day. Fair price."],
    ["Dwayne C.", 4, "2026-06-26", "Skilled fabricators", "They suggested a stronger design than I had in mind. Worth the extra cost."],
  ],
  "torque-and-tread-auto-care": [
    ["Melissa J.", 5, "2026-10-19", "Honest mechanics", "They showed me the worn part and only recommended what the car needed."],
    ["Andre B.", 5, "2026-09-07", "Fast turnaround", "Brake job done in an afternoon. Shuttle service was a nice touch."],
    ["Paul E.", 4, "2026-07-02", "Fair prices", "Alignment and tires at a good price. Waiting area is small."],
  ],
  "longhaul-logistics-group": [
    ["Teresa Q.", 4, "2026-10-11", "Dependable freight partner", "Drivers communicate well and tracking updates are accurate."],
    ["Vince M.", 5, "2026-08-23", "Handled a tight deadline", "Moved an urgent load across three states without a hitch."],
    ["Shana R.", 3, "2026-06-15", "Good but slow to quote", "Service was reliable, though the first quote took two days to arrive."],
  ],
  "meridian-legal-advisory": [
    ["Olivia P.", 5, "2026-10-28", "Clear, patient guidance", "Helped me set up my LLC and explained every document in plain English."],
    ["Frank D.", 5, "2026-09-12", "Understands military clients", "Handled my VA-related paperwork questions with care and professionalism."],
    ["Jessica T.", 5, "2026-07-19", "Responsive", "Always answered emails within a day. Fees were explained up front."],
  ],
  "fortitude-financial-planning": [
    ["Ray S.", 5, "2026-10-05", "Thoughtful retirement plan", "Walked me through TSP and pension choices without any pressure."],
    ["Monica C.", 5, "2026-08-08", "Great for military families", "Built a plan that accounts for PCS moves and deployments."],
    ["Ed L.", 4, "2026-05-24", "Knowledgeable", "Very helpful. I would love more online scheduling options."],
  ],
  "vector-cyber-solutions": [
    ["Naomi Z.", 5, "2026-10-17", "Security assessment was eye-opening", "Their report was clear and prioritized. We fixed the critical items in a week."],
    ["Greg H.", 4, "2026-08-31", "Professional team", "Strong technical depth and good communication with non-technical staff."],
    ["Lila K.", 4, "2026-06-06", "Helpful training", "Staff phishing training was engaging, not boring."],
  ],
  "northstar-web-software": [
    ["Carlos I.", 5, "2026-09-29", "Delivered our app on schedule", "Weekly demos kept us in the loop. The final product matched what we scoped."],
    ["Beth W.", 4, "2026-07-27", "Clean code and good docs", "Handover documentation made it easy for our in-house team to take over."],
    ["Aaron F.", 4, "2026-06-18", "Good value", "Reasonable rates and straightforward communication."],
  ],
  "ranger-strength-conditioning": [
    ["Jenna M.", 5, "2026-10-26", "Coaching that actually fits me", "Programs scale for every level. I am stronger and more confident."],
    ["Hector D.", 5, "2026-09-15", "Great community", "Motivating coaches and an encouraging crowd at the 6 a.m. class."],
    ["Pat N.", 4, "2026-07-10", "Excellent gym", "Clean equipment and attentive trainers. Gets crowded after work."],
  ],
  "stillwater-yoga-recovery": [
    ["Sophie A.", 5, "2026-10-21", "A calming space", "The recovery class helped my back more than I expected."],
    ["Mike J.", 5, "2026-09-03", "Veteran-friendly", "Instructors are patient and the trauma-informed classes feel safe."],
    ["Tasha B.", 5, "2026-08-16", "Wonderful instructors", "Beginners are welcomed, never rushed."],
  ],
  "homefront-realty-group": [
    ["Derek L.", 5, "2026-10-08", "Made our PCS purchase easy", "Our agent knew VA loan timelines inside out and kept everyone on schedule."],
    ["Lauren S.", 5, "2026-08-27", "Sold above asking", "Smart pricing advice and great staging tips."],
    ["Ian R.", 4, "2026-06-20", "Professional and responsive", "Quick replies even on weekends."],
  ],
  "sentinel-home-security": [
    ["Mara T.", 4, "2026-09-10", "Tidy installation", "Technician explained every camera placement before drilling."],
    ["Joel V.", 4, "2026-07-14", "Free survey was helpful", "Spotted a couple of weak points I had not considered."],
    ["Kim O.", 5, "2026-05-28", "Reliable monitoring", "Quick response when a false alarm triggered."],
  ],
  "greenline-lawn-landscape": [
    ["Walt P.", 5, "2026-10-12", "Yard looks sharp", "Crew shows up on time and edges are crisp every week."],
    ["Debra K.", 4, "2026-08-19", "Great landscape design", "The patio design transformed our backyard."],
    ["Nate G.", 4, "2026-06-23", "Dependable", "Communication is good and pricing is fair."],
  ],
  "trailhead-outfitters": [
    ["Elena V.", 5, "2026-10-24", "Unforgettable guided hike", "Our guide was knowledgeable, safety-minded and fun."],
    ["Russ A.", 5, "2026-09-09", "Gear advice I trusted", "Staff matched me with boots that fit instead of upselling."],
    ["Tia C.", 4, "2026-07-30", "Great skills course", "Learned navigation and first aid basics. Small group size was perfect."],
  ],
  "frontline-photo-film": [
    ["Brianna H.", 5, "2026-11-04", "Headshots we love", "Quick, comfortable session and the edits were back in two days."],
    ["Omar S.", 5, "2026-11-01", "Brand film nailed our story", "They listened first and shot second. The result feels honest."],
    ["Jill F.", 4, "2026-10-30", "Professional", "Easy to work with and flexible on scheduling."],
  ],
  "garrison-barber-shave": [
    ["Anthony R.", 5, "2026-11-06", "Best shave I've had", "Hot towel, sharp razor, great conversation. Monday discount is a nice thank-you."],
    ["Calvin D.", 5, "2026-11-05", "Consistent cuts", "Same quality every visit. Walk-ins are usually seen quickly."],
    ["Jeff M.", 5, "2026-11-03", "Classic barbershop", "Friendly crew and a clean shop."],
  ],
};

const bySlug = new Map(businesses.map((b) => [b.slug, b.id]));

export const reviews: Review[] = Object.entries(rows).flatMap(([slug, list]) => {
  const businessId = bySlug.get(slug);
  if (!businessId) return [];
  return list.map(([author, rating, createdAt, title, body], i) => ({
    id: `rev_${businessId}_${i + 1}`,
    businessId,
    author,
    rating,
    title,
    body,
    createdAt,
  }));
});
