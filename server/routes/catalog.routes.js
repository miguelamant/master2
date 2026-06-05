import { Router } from "express";
import axios from "axios";

const router = Router();

const OFF_FIELDS = "code,product_name,brands,image_front_url,nutriments,nutriscore_grade,quantity";

router.get("/catalog/veggie-burgers", async (req, res) => {
    try {
        const { data } = await axios.get("https://world.openfoodfacts.org/api/v2/search", {
            params: {
                categories_tags: "en:veggie-burgers",
                fields: OFF_FIELDS,
                page_size: 40,
                page: 1,
            },
            timeout: 10000,
        });
        res.json(data);
    } catch (err) {
        res.status(502).json({ error: "Failed to reach Open Food Facts" });
    }
});

export default router;
