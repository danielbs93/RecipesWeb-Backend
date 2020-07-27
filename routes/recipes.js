require("dotenv").config();
var express = require("express");
var router = express.Router();
const axios = require("axios");
const external_search = require("../CRUD/ExternalSearch_operations");
const crud = require("../CRUD/DB_operations");


//search recipe by conditional parameters
router.get('/search/query/:searchQuery/numOfRecipes/:number', async (req, res, next) => {
    const { searchQuery, number } = req.params;
    //parameters initialization
    search_params = {
        query: searchQuery,
        number: number,
        instructionsRequired: true
    };
    // res.send(req.params.query);
    external_search.extreactQueriesParams(req.query,search_params);
    // res.send(search_params);
    external_search.searchForRecipes(search_params)
    .then((info_array) => res.status(200).send(info_array))
    .catch ((err) => next(err));

});

//get random recipes for home page
router.get('/getRandomRecipes', async (req, res, next) => {
    try {
        let results = '';
        const random_recipes = [];
        while(random_recipes.length < 3) {
            let recipes = (await external_search.getRandomRecipes(3));
            results = await verifyRecipeInstructions(recipes.data.recipes,random_recipes);
        }
        // res.send(results);
        const recipesInfo = results.map((recipe) => external_search.extractRelevantRecipeData(recipe));
        res.status(200).send(await Promise.all(recipesInfo));
    } catch(err) {
        next(err);
    }
});


//get recipe information
router.get('/getRecipe/id/:recipe_id', async (req, res, next) => {
    const { recipe_id } = req.params;
    // console.log()
    search_params = {
        id: recipe_id,
        instructionsRequired: true
    }
    // console.log(search_params);
    var recipe_details = {};
    try {
        recipe_details = await external_search.getRecipeInstructions(recipe_id, next);
        // console.log(recipe_details);
        // .catch((err) => next(err));

        recipe_details.ingredients = await external_search.getRecipeIngredients(recipe_id, next);
        // // .catch((err) => next(err));
        let exist = await crud.checkOnDBrecipe(recipe_id);
        if (exist.length == 0) {
            await crud.addRecipeToDBFromAPI(recipe_id, recipe_details);
        }
        res.status(200).send(recipe_details);
        
    }
    catch (err) {
        next(err);
    }
    // return recipe_details;
}); 

/**
 * 
 * Validate that intsructions are inculded and not empty
 * @param {*} recipes_info 
 * @param {*} random_recipes 
 */

async function verifyRecipeInstructions(recipes, random_recipes){
    recipes.forEach(attribute => {
        if(random_recipes.length < 3 && attribute.instructions  && attribute.instructions.length > 0){
            random_recipes.push(attribute);
        }
    });
    return random_recipes;
}



module.exports = router;
