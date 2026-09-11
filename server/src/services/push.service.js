/**
 * Push Notification Service
 * Handles sending push notifications to subscribed users
 * Requires: npm install web-push
 */

const { isVapidConfigured, vapid } = require("../config/vapid");
const PushSubscription = require("../models/PushSubscription");
const User = require("../models/User");
const { countUnreadNotifications } = require("./notification.service");

let webpush;

if (isVapidConfigured()) {
  try {
    webpush = require("web-push");
    webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
    console.log("✅ Web Push configured successfully");
  } catch (error) {
    console.warn(
      "⚠️ Web Push not available. Install with: npm install web-push",
    );
    webpush = null;
  }
} else {
  console.warn(
    "⚠️ VAPID keys not configured. Push notifications disabled. Generate with: npx web-push generate-vapid-keys",
  );
}

/**
 * Send push notification to a single user
 * @param {string} userId - User ID
 * @param {Object} payload - Notification payload
 * @param {string} payload.title - Notification title
 * @param {string} payload.body - Notification body
 * @param {string} [payload.icon] - Icon URL
 * @param {string} [payload.badge] - Badge URL
 * @param {number} [payload.badgeCount] - Unread badge count for the app icon
 * @param {string} [payload.link] - Link to navigate to
 * @param {Object} [payload.data] - Additional data
 * @returns {Promise<Object>} Result with success/failure counts
 */
async function sendPushToUser(userId, payload) {
  if (!webpush) {
    return { sent: 0, failed: 0, reason: "Web Push not configured" };
  }

  try {
    const subscriptions = await PushSubscription.find({ userId });

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0, reason: "No subscriptions found" };
    }

    const badgeCount =
      typeof payload.badgeCount === "number"
        ? payload.badgeCount
        : await countUnreadNotifications(userId);

    const notificationPayload = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/resyin-mark.svg",
      badge: payload.badge || "/resyin-mark.svg",
      data: {
        link: payload.link || "/notifications",
        ...payload.data,
        badgeCount: Number.isFinite(badgeCount) ? badgeCount : 0,
      },
    };

    let sent = 0;
    let failed = 0;

    // Send to all subscriptions for this user
    for (const subscription of subscriptions) {
      try {
        const subscriptionObject = {
          endpoint: subscription.endpoint,
          keys: {
            auth: subscription.keys.auth,
            p256dh: subscription.keys.p256dh,
          },
        };

        await webpush.sendNotification(
          subscriptionObject,
          JSON.stringify(notificationPayload),
        );
        sent++;
      } catch (error) {
        console.error(`Failed to send push to subscription:`, error.message);
        failed++;

        // If subscription is invalid, remove it from database
        if (
          error.statusCode === 410 ||
          error.statusCode === 404 ||
          error.message === "Subscription no longer valid"
        ) {
          try {
            await PushSubscription.deleteOne({
              _id: subscription._id,
            });
          } catch (deleteError) {
            console.error("Error deleting invalid subscription:", deleteError);
          }
        }
      }
    }

    return { sent, failed, total: subscriptions.length };
  } catch (error) {
    console.error("Error sending push notification:", error);
    return { sent: 0, failed: 0, error: error.message };
  }
}

/**
 * Send push notification to multiple users
 * @param {Array<string>} userIds - Array of user IDs
 * @param {Object} payload - Notification payload
 * @returns {Promise<Object>} Aggregated result
 */
async function sendPushToUsers(userIds, payload) {
  if (!webpush) {
    return { totalSent: 0, totalFailed: 0, reason: "Web Push not configured" };
  }

  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const result = await sendPushToUser(userId, payload);
    totalSent += result.sent || 0;
    totalFailed += result.failed || 0;
  }

  return { totalSent, totalFailed };
}

/**
 * Send push notification to all admins
 * @param {Array<string>} adminIds - Array of admin IDs
 * @param {Object} payload - Notification payload
 * @returns {Promise<Object>} Result
 */
async function sendPushToAdmins(adminIds, payload) {
  return sendPushToUsers(adminIds, payload);
}

async function sendPushToAdminTeam(payload) {
  const staff = await User.find({ role: { $in: ["admin", "subadmin"] }, isSuspended: { $ne: true }, isDeleted: { $ne: true } }).select("_id").lean();
  return sendPushToUsers(staff.map((user) => user._id), payload);
}
  /**
   * Send push notification to all subadmins
   * @param {Array<string>} subadminIds - Array of subadmin IDs
   * @param {Object} payload - Notification payload
   * @returns {Promise<Object>} Result
   */
  async function sendPushToSubadmins(subadminIds, payload) {
    return sendPushToUsers(subadminIds, payload);
  }

/**
 * Check if push notifications are available
 * @returns {boolean} True if web-push is configured and installed
 */
function isPushAvailable() {
  return webpush !== null && isVapidConfigured();
}

module.exports = {
  sendPushToUser,
  sendPushToUsers,
  sendPushToAdmins,
  sendPushToAdminTeam,
  isPushAvailable,
};
