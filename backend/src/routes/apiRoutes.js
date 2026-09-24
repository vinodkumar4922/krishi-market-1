const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// Controllers
const categoryController = require('../controllers/categoryController');
const productController = require('../controllers/productController');
const farmerController = require('../controllers/farmerController');
const orderController = require('../controllers/orderController');
const reviewController = require('../controllers/reviewController');
const disputeController = require('../controllers/disputeController');
const adminController = require('../controllers/adminController');
const consumerController = require('../controllers/consumerController');

// 1. Categories
router.get('/categories', categoryController.getCategories);
router.post('/categories', authenticate, authorize('ADMIN'), categoryController.createCategory);
router.put('/categories/:id', authenticate, authorize('ADMIN'), categoryController.updateCategory);
router.patch('/categories/:id/toggle', authenticate, authorize('ADMIN'), categoryController.toggleCategoryStatus);

// 2. Products
router.get('/products', productController.getProducts);
router.get('/products/featured', productController.getFeaturedProducts);
router.get('/products/:id', productController.getProductById);
router.post('/products', authenticate, authorize('FARMER'), productController.createProduct);
router.put('/products/:id', authenticate, authorize('FARMER', 'ADMIN'), productController.updateProduct);
router.delete('/products/:id', authenticate, authorize('FARMER', 'ADMIN'), productController.deleteProduct);
router.get('/farmer/my-products', authenticate, authorize('FARMER'), productController.getFarmerProducts);

// 3. Image Upload (MIME check, size check, safe UUID filename)
router.post('/upload', authenticate, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  return res.status(200).json({ success: true, url: fileUrl });
});

// 4. Farmers
router.get('/farmers', farmerController.getFarmersList);
router.get('/farmers/:id', farmerController.getFarmerProfile);
router.get('/farmer/dashboard-stats', authenticate, authorize('FARMER'), farmerController.getFarmerDashboardStats);

// 5. Orders & Logistics
router.post('/orders', authenticate, authorize('CONSUMER'), orderController.createOrder);
router.get('/orders/consumer', authenticate, authorize('CONSUMER'), orderController.getConsumerOrders);
router.get('/orders/farmer', authenticate, authorize('FARMER'), orderController.getFarmerOrders);
router.get('/orders/:id', authenticate, orderController.getOrderById);
router.patch('/orders/:id/status', authenticate, authorize('FARMER', 'ADMIN'), orderController.updateOrderStatus);

// 6. Reviews (Purchase-Gated)
router.post('/reviews', authenticate, authorize('CONSUMER'), reviewController.createReview);
router.get('/reviews/product/:productId', reviewController.getProductReviews);
router.get('/reviews/farmer/:farmerId', reviewController.getFarmerReviews);

// 7. Disputes
router.post('/disputes', authenticate, authorize('CONSUMER'), disputeController.createDispute);
router.get('/disputes/my-disputes', authenticate, authorize('CONSUMER'), disputeController.getUserDisputes);
router.get('/disputes/admin', authenticate, authorize('ADMIN'), disputeController.getAllDisputesAdmin);
router.patch('/disputes/:id/resolve', authenticate, authorize('ADMIN'), disputeController.resolveDisputeAdmin);

// 8. Wishlist & Notifications
router.get('/consumer/wishlist', authenticate, authorize('CONSUMER'), consumerController.getWishlist);
router.post('/consumer/wishlist/toggle', authenticate, authorize('CONSUMER'), consumerController.toggleWishlist);
router.get('/notifications', authenticate, consumerController.getNotifications);
router.patch('/notifications/read-all', authenticate, consumerController.markNotificationRead);

// 9. Admin Dashboard & Verifications
router.get('/admin/pending-farmers', authenticate, authorize('ADMIN'), adminController.getPendingFarmers);
router.get('/admin/all-farmers', authenticate, authorize('ADMIN'), adminController.getAllFarmers);
router.patch('/admin/verify-farmer/:id', authenticate, authorize('ADMIN'), adminController.verifyFarmer);
router.get('/admin/analytics', authenticate, authorize('ADMIN'), adminController.getAdminDashboardAnalytics);
router.get('/admin/audit-logs', authenticate, authorize('ADMIN'), adminController.getAuditLogs);

module.exports = router;
