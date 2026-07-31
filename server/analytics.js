const allowedEvents = new Set([
  'signup_completed',
  'login_completed',
  'prediction_created',
  'prediction_viewed',
  'comment_created',
  'prediction_resolved',
  'feed_filter_used',
  'feedback_submitted',
]);

export function analyticsEventData(eventName, userId = null, entityId = null) {
  if (!allowedEvents.has(eventName)) {
    throw new TypeError(`Unsupported analytics event: ${eventName}`);
  }

  return { eventName, userId: userId || null, entityId: entityId || null };
}

export async function recordEvent(prisma, eventName, userId = null, entityId = null) {
  return prisma.analyticsEvent.create({
    data: analyticsEventData(eventName, userId, entityId),
  });
}
