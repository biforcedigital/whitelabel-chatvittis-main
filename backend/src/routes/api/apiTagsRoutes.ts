import express from "express";

import * as TagsController from "../../controllers/api/TagsController";
import isAuthCompany from "../../middleware/isAuthCompany";


const apiTagsRoutes = express.Router();

apiTagsRoutes.get("/tags", isAuthCompany, TagsController.index);

export default apiTagsRoutes;