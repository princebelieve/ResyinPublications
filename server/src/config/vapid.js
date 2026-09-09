/**
 * VAPID Configuration for Web Push Notifications
 * Generate keys once with: npx web-push generate-vapid-keys
 * Store in .env: VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY
 */

const vapid = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
  subject: process.env.VAPID_SUBJECT || "mailto:info@resyinpublications.com",
};

/**
 * Validate VAPID keys are configured
 * @returns {boolean} true if keys are available
 */
function isVapidConfigured() {
  return !!(vapid.publicKey && vapid.privateKey);
}

module.exports = {
  vapid,
  isVapidConfigured,
};
