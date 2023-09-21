import express from "express";
import { getProducts } from "../controllers/productControllers.js";
const router = express.Router();

router.get("/products").use(getProducts);

export default router;
