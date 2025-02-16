import { Request, Response } from 'express';
import knex from '../db/index';
import { responseSuccess, responseFailure } from '../utils/Response';
import CategoryDTO from '../dto/CategoryDTO';

class CategoryController {
    async getCategoryByID(req: Request, res: Response) {
        try {
            const categoryID = req.params.category_id;

            if (!categoryID) {
                responseFailure(res, 400, 'Category ID is required');
                return;
            }

            const category = await knex('categories')
                .where('id', categoryID)
                .first();

            if (!category) {
                responseFailure(res, 404, 'Category not found');
                return;
            }

            const categoryDTO = new CategoryDTO(
                category.id,
                category.name,
                category.icon,
                category.type
            );

            responseSuccess(res, categoryDTO);
        } catch (error) {
            console.log(error);
            responseFailure(res, 500, error);
        }
    }

    async getAllCategories(req: Request, res: Response) {
        try {
            const categories = await knex('categories').select('*');

            const categoriesDTO = categories.map(category => new CategoryDTO(
                category.id,
                category.name,
                category.icon,
                category.type
            ));

            responseSuccess(res, categoriesDTO);
        } catch (error) {
            console.log(error);
            responseFailure(res, 500, error);
        }
    }
}
export default new CategoryController();