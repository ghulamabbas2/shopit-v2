import express from "express";
import {
  canUserReview,
  createProductReview,
  deleteProduct,
  deleteProductImage,
  deleteReview,
  getAdminProducts,
  getProductDetails,
  getProductReviews,
  getProducts,
  newProduct,
  updateProduct,
  uploadProductImages,
} from "../controllers/productControllers.js";
import { authorizeRoles, isAuthenticatedUser } from "../middlewares/auth.js";
const router = express.Router();

router.route("/products").get(getProducts);
router
  .route("/admin/products")
  .post(isAuthenticatedUser, authorizeRoles("admin"), newProduct)
  .get(isAuthenticatedUser, authorizeRoles("admin"), getAdminProducts);

router.route("/products/:id").get(getProductDetails);

router
  .route("/admin/products/:id/upload_images")
  .put(isAuthenticatedUser, authorizeRoles("admin"), uploadProductImages);

router
  .route("/admin/products/:id/delete_image")
  .put(isAuthenticatedUser, authorizeRoles("admin"), deleteProductImage);

router
  .route("/admin/products/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateProduct);
router
  .route("/admin/products/:id")
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteProduct);

router
  .route("/reviews")
  .get(isAuthenticatedUser, getProductReviews)
  .put(isAuthenticatedUser, createProductReview);

router
  .route("/admin/reviews")
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteReview);

router.route("/can_review").get(isAuthenticatedUser, canUserReview);

export default router;
