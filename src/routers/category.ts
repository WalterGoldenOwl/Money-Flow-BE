import express from 'express';
import CategoryController from '../controllers/CategoryController';

const CategoryRouter = express.Router();

CategoryRouter.get('/', CategoryController.getAllCategories);
CategoryRouter.get('/:category_id', CategoryController.getCategoryByID);

export default CategoryRouter;