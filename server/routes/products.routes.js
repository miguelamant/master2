import { Router } from "express";
import { isAuthenticated } from "../middleware/auth.js";

import {
  listProducts,
  listCategories,
  listSubcategories,
  itemsNotOnMenu,
  segmentsBySection,
  filterRegistry,
  priceComparison,
  businessInfo,
} from "../controllers/products.controller.js";

const router = Router();

/* products / categories / subcategories */
router.get("/products",        isAuthenticated, listProducts);
router.get("/categories",      isAuthenticated, listCategories);
router.get("/subcategories",   isAuthenticated, listSubcategories);

/* items not on menu */
router.get("/items-not-on-menu", isAuthenticated, itemsNotOnMenu);

/* segments (by section) */
router.get("/segments",          isAuthenticated, segmentsBySection);

/* filter-registry */
router.get("/filter-registry",   isAuthenticated, filterRegistry);

/* price comparison */
router.get("/price-comparison",  isAuthenticated, priceComparison);

/* business-info */
router.get("/business-info",     isAuthenticated, businessInfo);

export default router;
