const express = require('express');
const router = express.Router();

const { authenticate, authenticateOptional } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const {
  requireApprovedFarmer,
  requireProductOwnership,
  requireOrderAccess,
} = require('../middleware/ownershipMiddleware');
const { upload, validateImageMagicBytes } = require('../middleware/uploadMiddleware');

// Validators
const {
  validateCreateProduct,
  validateUpdateProduct,
  validateCreateCategory,
  validateUpdateCategory,
  validateCreateOrder,
  validateUpdateOrderStatus,
  validateCreateReview,
  validateCreateDispute,
  validateResolveDispute,
  validateVerifyFarmer,
} = require('../validators');

// Controllers
const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const farmerController = require('../controllers/farmerController');
const orderController = require('../controllers/orderController');
const reviewController = require('../controllers/reviewController');
const disputeController = require('../controllers/disputeController');
const adminController = require('../controllers/adminController');
const consumerController = require('../controllers/consumerController');
const deliverySlotController = require('../controllers/deliverySlotController');
const searchController = require('../controllers/searchController');
const contactController = require('../controllers/contactController');
const { contactLimiter } = require('../middleware/rateLimiter');

// 0. Global Backend Search & Support
router.get('/search', searchController.globalSearch);
router.post('/contact', contactLimiter, contactController.submitContactInquiry);

// 1. Categories
router.get('/categories', authenticateOptional, categoryController.getCategories);
router.post(
  '/categories',
  authenticate,
  authorize('ADMIN'),
  validateCreateCategory,
  categoryController.createCategory
);
router.put(
  '/categories/:id',
  authenticate,
  authorize('ADMIN'),
  validateUpdateCategory,
  categoryController.updateCategory
);
router.patch('/categories/:id/toggle', authenticate, authorize('ADMIN'), categoryController.toggleCategoryStatus);

// 2. Products
router.get('/products', productController.getProducts);
router.get('/products/featured', productController.getFeaturedProducts);
router.get('/products/:id', productController.getProductById);
router.post(
  '/products',
  authenticate,
  authorize('FARMER'),
  requireApprovedFarmer,
  validateCreateProduct,
  productController.createProduct
);
router.put(
  '/products/:id',
  authenticate,
  authorize('FARMER', 'ADMIN'),
  requireProductOwnership,
  validateUpdateProduct,
  productController.updateProduct
);
router.delete(
  '/products/:id',
  authenticate,
  authorize('FARMER', 'ADMIN'),
  requireProductOwnership,
  productController.deleteProduct
);
router.get('/farmer/my-products', authenticate, authorize('FARMER'), productController.getFarmerProducts);

// 3. Image Upload (MIME check, size check, safe UUID filename, binary magic byte validation)
router.post('/upload', authenticate, upload.single('image'), validateImageMagicBytes, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  return res.status(200).json({
    success: true,
    message: 'Image uploaded securely',
    url: fileUrl,
    data: {
      url: fileUrl,
      fileUrl,
      filename: req.file.filename,
      size: req.file.size,
    },
    filename: req.file.filename,
    size: req.file.size,
  });
});

// 4. Farmers
router.get('/farmers', farmerController.getFarmersList);
router.get('/farmers/dashboard', authenticate, authorize('FARMER'), farmerController.getFarmerDashboardStats);
router.get('/farmer/dashboard-stats', authenticate, authorize('FARMER'), farmerController.getFarmerDashboardStats);
router.put('/farmer/profile', authenticate, authorize('FARMER'), farmerController.updateFarmerProfile);
router.get('/farmers/:id', farmerController.getFarmerProfile);

// 5. Delivery Slots & Cart
router.get('/delivery-slots', deliverySlotController.getActiveDeliverySlots);
router.post('/cart/validate', orderController.validateCart);

// 6. Orders & Logistics
router.post(
  '/orders',
  authenticate,
  authorize('CONSUMER'),
  validateCreateOrder,
  orderController.createOrder
);
router.get('/orders/consumer', authenticate, authorize('CONSUMER'), orderController.getConsumerOrders);
router.get('/orders/farmer', authenticate, authorize('FARMER'), orderController.getFarmerOrders);
router.get('/orders/:id', authenticate, requireOrderAccess, orderController.getOrderById);
router.get('/orders/:id/invoice', authenticate, requireOrderAccess, orderController.getOrderInvoice);
router.patch(
  '/orders/:id/status',
  authenticate,
  authorize('FARMER', 'ADMIN'),
  validateUpdateOrderStatus,
  orderController.updateOrderStatus
);
router.patch('/orders/:id/cancel', authenticate, orderController.cancelOrder);

// 7. Reviews (Purchase-Gated)
router.post(
  '/reviews',
  authenticate,
  authorize('CONSUMER'),
  validateCreateReview,
  reviewController.createReview
);
router.get('/reviews/product/:productId', reviewController.getProductReviews);
router.get('/reviews/farmer/:farmerId', reviewController.getFarmerReviews);

// 8. Disputes
router.post(
  '/disputes',
  authenticate,
  authorize('CONSUMER'),
  validateCreateDispute,
  disputeController.createDispute
);
router.get('/disputes/my-disputes', authenticate, authorize('CONSUMER'), disputeController.getUserDisputes);
router.get('/disputes/admin', authenticate, authorize('ADMIN'), disputeController.getAllDisputesAdmin);
router.patch(
  '/disputes/:id/resolve',
  authenticate,
  authorize('ADMIN'),
  validateResolveDispute,
  disputeController.resolveDisputeAdmin
);

// 9. Wishlist & Notifications
router.get('/consumer/wishlist', authenticate, authorize('CONSUMER'), consumerController.getWishlist);
router.post('/consumer/wishlist/toggle', authenticate, authorize('CONSUMER'), consumerController.toggleWishlist);
router.delete('/consumer/wishlist/:productId', authenticate, authorize('CONSUMER'), consumerController.removeFromWishlist);
router.get('/notifications', authenticate, consumerController.getNotifications);
router.patch('/notifications/:id/read', authenticate, consumerController.markSingleNotificationRead);
router.patch('/notifications/read-all', authenticate, consumerController.markNotificationRead);

// 10. Admin Governance, Analytics, Moderation & Security
router.get('/admin/pending-farmers', authenticate, authorize('ADMIN'), adminController.getPendingFarmers);
router.get('/admin/all-farmers', authenticate, authorize('ADMIN'), adminController.getAllFarmers);
router.patch(
  '/admin/verify-farmer/:id',
  authenticate,
  authorize('ADMIN'),
  validateVerifyFarmer,
  adminController.verifyFarmer
);
router.get('/admin/analytics', authenticate, authorize('ADMIN'), adminController.getAdminDashboardAnalytics);
router.get('/admin/analytics/detailed', authenticate, authorize('ADMIN'), adminController.getDetailedAnalytics);
router.get('/admin/audit-logs', authenticate, authorize('ADMIN'), adminController.getAuditLogs);
router.get('/admin/security-events', authenticate, authorize('ADMIN'), adminController.getSecurityEvents);
router.get('/admin/consumers', authenticate, authorize('ADMIN'), adminController.getAllConsumers);
router.patch('/admin/consumers/:id/toggle', authenticate, authorize('ADMIN'), adminController.toggleConsumerStatus);
router.get('/admin/products', authenticate, authorize('ADMIN'), adminController.getAllProductsAdmin);
router.patch('/admin/products/:id/toggle', authenticate, authorize('ADMIN'), adminController.toggleProductStatusAdmin);
router.get('/admin/orders', authenticate, authorize('ADMIN'), adminController.getAllOrdersAdmin);
router.get('/admin/reports/:type', authenticate, authorize('ADMIN'), adminController.generateReport);

module.exports = router;
