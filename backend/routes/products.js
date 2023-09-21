import express from "express";
import { getProducts } from "../controllers/productControllers.js";
const router = express.Router();

router.route("/products").get(getProducts);

export default router;
