//relevant imports
const express = require("express");
const axios = require("axios");
const api_url = "https://api.spoonacular.com/recipes";
const api_key = process.env.spooncular_apiKey;
const router = express.Router();


//-----EXTRACTIONS-----
/**
 * This function responsible for extracting the data associated with the search filters
 */
exports.extreactQueriesParams = function (query_params,search_params){

    const params_list=["diet", "cuisine", "intolerance"];
    params_list.forEach((param)=> {
      if(query_params[param]){
        search_params[param]=query_params[param];
      }
    });  
    // return search_params;
  }


//recive recipe information


//extract relevant properties or data from recived recipes 

exports.extractSearchResultsIds = function (search_response) {
    let recipes = search_response.data.results;
    recipes_ids = [];
    recipes.map((recipe) => {
        // console.log(recipe.title);
        recipes_ids.push(recipe.id);
    });
    return recipes_ids;
}

/**
 * This functions responsible to extract only the necessary data for our website
 */
exports.extractRelevantRecipeData = function (recipes_Info) {
    // for each cell in map (recipe) get relevant information with keys
    if(recipes_Info.vegetarian){
        recipes_Info.vegetarian=1;
    }else{
        recipes_Info.vegetarian=0;
    }

    if(recipes_Info.glutenFree){
        recipes_Info.glutenFree=1;
    }else{
      recipes_Info.glutenFree=0;
    }

    if(recipes_Info.vegan){
        recipes_Info.vegan=1;
    }else{
      recipes_Info.vegan=0;
    }
    
    const {
        id,
        title,
        readyInMinutes,
        aggregateLikes,
        vegetarian,
        vegan,
        glutenFree,
        instructions,
        image,
      } = recipes_Info;
      return { 
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        likes: aggregateLikes,
        vegetarian: vegetarian,
        vegan: vegan,
        glutenFree: glutenFree,
        instructions: instructions,
        image: image,
      };
  }

  exports.extractRecipeDataForSearch = function (recipes_info) {
    return recipes_info.map((recipe) => this.extractRelevantRecipeData(recipe.data));
}

  /**
   * Recieving the recipes information  from spooncular
   */
exports.getRecipesInfo = async function (recipes_ids_list){
    let promises = [];
    recipes_ids_list.map((id) => 
        promises.push(axios.get(`${api_url}/${id}/information`, {
            params: {
                includeNutrition: false,
                apiKey: api_key,
            }
        }))
    );
    let info_response = await Promise.all(promises);
    return this.extractRecipeDataForSearch(info_response);
}

//search query for recipe according to spooncular
exports.searchForRecipes = async function (search_params) {
    //set defualt number to 5
    if (search_params.number == null || (search_params.number != 10 && search_params.number != 15)) {
        search_params.number = 5;
    }
    search_params.apiKey = api_key;
    let search_response = await axios.get(
        `${api_url}/search?${api_key}`, {
            params: search_params,
        }
    );
    const recipes_id_list = this.extractSearchResultsIds(search_response);
    let info_array = await this.getRecipesInfo(recipes_id_list);
    // console.log(search_response.data);
    return info_array;
}

//get 3 random recipes from spooncular
exports.getRandomRecipes = async (number) => {
    const random_recipes = await axios.get(
      `${api_url}/random?apiKey=${api_key}&number=${number}`
    )
        
    return random_recipes;
  }

  /**
   * Get recipes ingredients from spooncular
   */
exports.getRecipeIngredients = async function (recipeID, next) {
    var recipe_ingredients = {};
    await axios.
    get (`${api_url}/${recipeID}/information?apiKey=${api_key}&includeNutrition=false`)//, {
    .then (async (response) => {
        recipe_ingredients = await this.extractRecipeIngredients(response);
    })
    .catch ((err) => next(err));
    return recipe_ingredients;
}

/**
 * extract relevant data for our website on the ingredients
 */
exports.extractRecipeIngredients = async function (recipes) {
    return recipes.data.extendedIngredients.map((recipe) => {
        const { name, measures, image, id } = recipe;
        return {
        image: image,
        ingredient_id: id,
        ingredient_name: name,
        ingredient_evaluate_unit_survey: measures.metric.unitShort,
        ingredient_amount: measures.metric.amount
        }
    });
}

  /**
   * Get recipes instructions from spooncular
   */
  exports.getRecipeInstructions = async function (recipeID, next) {
      var recipe_details = {};
    await axios.
    get (`${api_url}/${recipeID}/information?apiKey=${api_key}`)
    .then (async (response) => {
        // console.log(response);
        recipe_details.information = await this.extractRelevantRecipeData(response.data);
        recipe_details.analyzedInstructions = await this.extractRecipeInstructions(response);
        // console.log(recipe_details.analyzedInstructions);
    })
    .catch ((err) => {
        next(err);
        // console.log(err);
    });
    // console.log(recipe_details);
    return recipe_details;
}

/**
 * extract relevant data for our website on the ingredients
 */
exports.extractRecipeInstructions = async function (recipes) {
    return await recipes.data.analyzedInstructions[0].steps.map((recipe) => {
        const { number, step, equipment, ingredients } = recipe;
        return {
            stage_number: number,
            stage_description: step,
            stage_equipment: equipment,
            stage_ingredients: ingredients,
        }
    });
}
