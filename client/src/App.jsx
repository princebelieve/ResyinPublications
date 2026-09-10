//client/src/App.jsx
import { Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect, useLayoutEffect } from "react";

import { CartProvider } from "./context/CartContext";
import { NotificationProvider } from "./context/NotificationContext";

import Home from "./pages/Home";
import Collection from "./pages/Collection";
import ProductDetails from "./pages/ProductDetails";
import Success from "./pages/Success";
import Cancel from "./pages/Cancel";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Dashboard from "./pages/Dashboard";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import AdminProducts from "./pages/AdminProducts";
import AdminProductForm from "./pages/AdminProductForm";

import RequireAdmin from "./components/RequireAdmin.jsx";
import RequireAdminOrSubadmin from "./components/RequireAdminOrSubadmin.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import AdminOrders from "./pages/AdminOrders";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLayout from "./components/admin/AdminLayout";
import AdminSales from "./pages/AdminSales";
import AdminStockAlerts from "./pages/AdminStockAlerts";
import AdminOrderDetails from "./pages/AdminOrderDetails";
import AdminDeliveryBoard from "./pages/AdminDeliveryBoard";
import AdminShipping from "./pages/AdminShipping";
import AdminPaymentSettings from "./pages/AdminPaymentSettings";
import AdminPublisherSubscriptionSettings from "./pages/AdminPublisherSubscriptionSettings";
import AdminTransportCompanies from "./pages/AdminTransportCompanies";
import AdminInquiries from "./pages/AdminInquiries";
import AdminUsers from "./pages/AdminUsers";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Notifications from "./pages/Notifications";
import NotificationDetails from "./pages/NotificationDetails";
import AdminNotifications from "./pages/AdminNotifications";
import PwaNotificationBanner from "./components/PwaNotificationBanner";
import PwaInstallBanner from "./components/PwaInstallBanner";
import PrivacyConsentBanner from "./components/PrivacyConsentBanner";
import SiteAnnouncementBanner from "./components/SiteAnnouncementBanner";
import SitewideImageAdvert from "./components/SitewideImageAdvert";
import SupportAssistant from "./components/SupportAssistant";
import SupportGuide from "./pages/SupportGuide";
import HowToUse from "./pages/HowToUse";
import Testimonials from "./pages/Testimonials";
import AdminTestimonials from "./pages/AdminTestimonials";
import PullToRefresh from "./components/PullToRefresh";
import RequireDistributor from "./components/RequireDistributor";
import DistributorDashboard from "./pages/DistributorDashboard";
import AdminDistributors from "./pages/AdminDistributors";
import DistributorStore from "./pages/DistributorStore";
import Outreach from "./pages/Outreach";
import Journey from "./pages/Journey";
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const PwaInstallInstructions = lazy(
  () => import("./pages/PwaInstallInstructions"),
);

function CanonicalUpdater() {
  const location = useLocation();

  useEffect(() => {
    const canonicalUrl = `https://resyinpublications.com${location.pathname}${location.search}`;
    let canonical = document.querySelector('link[rel="canonical"]');

    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }

    canonical.setAttribute("href", canonicalUrl);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute("content", canonicalUrl);
    }
  }, [location]);

  return null;
}

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);

  return null;
}

function CaptureInstallPrompt() {
  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      // Prevent automatic install prompt
      event.preventDefault();
      // Store the event for later use
      window.__deferredPrompt = event;
      console.log("✅ Install prompt captured and ready");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  return null;
}

export default function App() {
  return (
    <CartProvider>
      <NotificationProvider>
        <CanonicalUpdater />
        <ScrollToTop />
        <CaptureInstallPrompt />
        <SupportAssistant />
        <PwaNotificationBanner />
        <PwaInstallBanner />
        <PrivacyConsentBanner />
        <SiteAnnouncementBanner />
        <SitewideImageAdvert />
        <PullToRefresh />
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/d/:code" element={<DistributorStore />} />

            <Route
              path="/cart"
              element={
                <RequireAuth>
                  <Cart />
                </RequireAuth>
              }
            />
            <Route
              path="/checkout"
              element={
                <RequireAuth>
                  <Checkout />
                </RequireAuth>
              }
            />

            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route path="/distributor" element={<RequireDistributor><DistributorDashboard /></RequireDistributor>} />

            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />

            <Route
              path="/profile/edit"
              element={
                <RequireAuth>
                  <EditProfile />
                </RequireAuth>
              }
            />

            <Route
              path="/notifications"
              element={
                <RequireAuth>
                  <Notifications />
                </RequireAuth>
              }
            />
            <Route path="/notifications/:id" element={<RequireAuth><NotificationDetails /></RequireAuth>} />

            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/support" element={<SupportGuide />} />
            <Route path="/how-to-use" element={<HowToUse />} />
            <Route path="/testimonials" element={<Testimonials />} />
            <Route path="/outreach" element={<Outreach />} />
            <Route path="/journey" element={<Journey />} />
            <Route path="/success" element={<Success />} />
            <Route path="/cancel" element={<Cancel />} />

            {/* AUTH */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* ADMIN */}
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </RequireAdmin>
              }
            />

            <Route
              path="/admin/products"
              element={
                <RequireAdminOrSubadmin>
                  <AdminLayout>
                    <AdminProducts />
                  </AdminLayout>
                </RequireAdminOrSubadmin>
              }
            />

            <Route
              path="/admin/products/new"
              element={
                <RequireAdminOrSubadmin>
                  <AdminLayout>
                    <AdminProductForm />
                  </AdminLayout>
                </RequireAdminOrSubadmin>
              }
            />

            <Route
              path="/admin/products/edit/:id"
              element={
                <RequireAdmin>
                  <AdminLayout>
                    <AdminProductForm />
                  </AdminLayout>
                </RequireAdmin>
              }
            />

            <Route
              path="/admin/orders"
              element={
                <RequireAdmin>
                  <AdminLayout>
                    <AdminOrders />
                  </AdminLayout>
                </RequireAdmin>
              }
            />
            <Route path="/admin/distributors" element={<RequireAdmin><AdminLayout><AdminDistributors /></AdminLayout></RequireAdmin>} />

            <Route
              path="/admin/orders/:id"
              element={
                <RequireAdmin>
                  <AdminLayout>
                    <AdminOrderDetails />
                  </AdminLayout>
                </RequireAdmin>
              }
            />

            <Route
              path="/admin/sales"
              element={
                <RequireAdmin>
                  <AdminLayout>
                    <AdminSales />
                  </AdminLayout>
                </RequireAdmin>
              }
            />

            <Route
              path="/admin/stock"
              element={
                <RequireAdmin>
                  <AdminLayout>
                    <AdminStockAlerts />
                  </AdminLayout>
                </RequireAdmin>
              }
            />

            <Route
              path="/admin/delivery"
              element={
                <RequireAdmin>
                  <AdminLayout>
                    <AdminDeliveryBoard />
                  </AdminLayout>
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/shipping"
              element={
                <RequireAdmin>
                  <AdminLayout>
                    <AdminShipping />
                  </AdminLayout>
                </RequireAdmin>
              }
            />
            <Route path="/admin/payment-settings" element={<RequireAdmin><AdminLayout><AdminPaymentSettings /></AdminLayout></RequireAdmin>} />
            <Route path="/admin/publisher-subscription-settings" element={<RequireAdmin><AdminLayout><AdminPublisherSubscriptionSettings /></AdminLayout></RequireAdmin>} />
            <Route path="/admin/transport-companies" element={<RequireAdmin><AdminLayout><AdminTransportCompanies /></AdminLayout></RequireAdmin>} />
            <Route
              path="/admin/inquiries"
              element={
                <RequireAdmin>
                  <AdminLayout>
                    <AdminInquiries />
                  </AdminLayout>
                </RequireAdmin>
              }
            />

            <Route
              path="/admin/content"
              element={
                <RequireAdminOrSubadmin>
                  <AdminLayout>
                    <AdminTestimonials />
                  </AdminLayout>
                </RequireAdminOrSubadmin>
              }
            />

            <Route
              path="/admin/testimonials"
              element={
                <RequireAdminOrSubadmin>
                  <AdminLayout>
                    <AdminTestimonials />
                  </AdminLayout>
                </RequireAdminOrSubadmin>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RequireAdmin>
                  <AdminLayout>
                    <AdminUsers />
                  </AdminLayout>
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RequireAdmin>
                  <AdminLayout>
                    <AdminUsers />
                  </AdminLayout>
                </RequireAdmin>
              }
            />
            <Route
              path="/admin/send-notification"
              element={
                <RequireAdminOrSubadmin>
                  <AdminLayout>
                    <AdminNotifications />
                  </AdminLayout>
                </RequireAdminOrSubadmin>
              }
            />

            {/* POLICIES */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route
              path="/install-instructions"
              element={<PwaInstallInstructions />}
            />
          </Routes>
        </Suspense>
      </NotificationProvider>
    </CartProvider>
  );
}
