import { normalizeNotificationLink } from "./notificationLinks";

export function getNotificationDestination(notification, isAdmin) {
  const productId = notification?.data?.productId;

  if (productId) {
    return isAdmin
      ? `/admin/products/edit/${productId}`
      : `/product/${productId}`;
  }

  return normalizeNotificationLink(notification?.link);
}

export function getNotificationActionLabel(notification, isAdmin) {
  if (!notification?.data?.productId) return "Open";
  if (!isAdmin) return "View product";
  return notification?.data?.status === "pending" || notification?.type === "product.upload"
    ? "Review product"
    : "Edit product";
}
