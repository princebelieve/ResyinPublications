const Notification = require("../models/Notification");

/**
 * Create a notification for a user
 * @param {Object} payload
 * @param {string} payload.userId - User ID
 * @param {string} payload.type - Notification type (e.g., 'order.created')
 * @param {string} payload.title - Notification title
 * @param {string} payload.body - Notification body
 * @param {string} [payload.link] - Optional link to navigate to
 * @param {Object} [payload.data] - Optional additional data
 * @returns {Promise<Object>} Created notification
 */
async function createNotification(payload) {
  try {
    const {
      userId,
      type = "general",
      title,
      body,
      link = "",
      data = {},
    } = payload;

    if (!userId || !title || !body) {
      console.error("Missing required notification fields:", payload);
      return null;
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      body,
      link,
      data,
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

/**
 * Count unread approved notifications for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Unread notification count
 */
async function countUnreadNotifications(userId) {
  try {
    if (!userId) {
      return 0;
    }

    return await Notification.countDocuments({
      userId,
      status: "approved",
      read: false,
    });
  } catch (error) {
    console.error("Error counting unread notifications:", error);
    return 0;
  }
}

/**
 * Create notifications for multiple users
 * @param {Array<string>} userIds - Array of user IDs
 * @param {Object} notificationPayload - Notification data (without userId)
 * @returns {Promise<Array>} Created notifications
 */
async function createNotificationsForUsers(userIds, notificationPayload) {
  try {
    const notifications = await Promise.all(
      userIds.map((userId) =>
        createNotification({
          userId,
          ...notificationPayload,
        }),
      ),
    );

    return notifications.filter((n) => n !== null);
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    return [];
  }
}

/**
 * Create notification for all admin users
 * @param {Object} notificationPayload - Notification data (without userId)
 * @param {Array<string>} adminIds - Array of admin user IDs
 * @returns {Promise<Array>} Created notifications
 */
async function notifyAdmins(notificationPayload, adminIds) {
  try {
    return await createNotificationsForUsers(adminIds, notificationPayload);
  } catch (error) {
    console.error("Error notifying admins:", error);
    return [];
  }
}

module.exports = {
  createNotification,
  countUnreadNotifications,
  createNotificationsForUsers,
  notifyAdmins,
};
