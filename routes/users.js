require("dotenv").config();
var express = require("express");
var router = express.Router();
const axios = require("axios");
const fs = require("fs");
const path = require('path');
const crud = require("../CRUD/DB_operations");

// Authentication 

// router.use(async (req, res, next) => {
//     console.log(req.session);
//     if (req.session && req.session.user_id) {
//       const user = await crud.getUserByID(req.session.user_id);
//       if (user.length > 0) {
//         req.userID = user[0];
//         next();
//       }
//     } else {
//       res.status(401).send({message: "something were wrong with the authentication", success: false});
//     }
//   });


//GET all personal recipes
router.get("/getMyRecipies" , async function (req, res, next) {
    try{
        let userID = req.userID;
        let recipes = await crud.getAllUserRecipes(userID);
        // console.log(recipes);
        if(recipes.length === 0 ){
            throw {status: 404, message: "Not Found any recipes" }; 
        }
        res.status(200).send(recipes);
    }catch(err){
        next(err);
    }
});
//get user's recipe total information
router.get("/getMyRecipe/id/:recipe_id", async (req,res,next) => {
    var my_recipe = {};
    try {
        const { recipe_id } = req.params;
        let recipe = await crud.getRecipeInfo(recipe_id);
        my_recipe.information = {
            id: recipe[0].recipe_id,
            title: recipe[0].recipe_name,
            likes: recipe[0].popularity,
            readyInMinutes: recipe[0].cooking_time,
            vegan: recipe[0].vegan,
            vegeterian: recipe[0].vegeterian,
            glutenFree: recipe[0].glutenFree,
            image: recipe[0].image_url,
            instructions: recipe[0].instructions
        };
        my_recipe.ingredients = await crud.getRecipeIngredients(recipe_id);
        my_recipe.analyzedInstructions = await crud.getRecipeInstructions(recipe_id);
        if (recipe.length === 0){
            throw {status: 404, message: "Recipe Not Found"}
        }
        res.status(200).send(my_recipe);
    }
    catch(err) {
        next(err);
    }

});

//======================================================================
//POST user recipe
/**
 * Format for inserting the recipe:
 * recipe.information will includes the next fields:image,likes,glutenFree,vegan,vegetarian,readyInMinutes,title
 * recipe.ingredients will includes the next fields:ingredient_name,ingredient_evaluate_unit_survey,ingredient_amount
 * recipe.analyzedInstructions will includes the next fields:stage_number,stage_description
 * 
 * Maybe to check if the title of the recipe is already exist for not inserting twice the same recipe
 */
router.post("/addToMyRecipies" , async function (req, res, next) {
    try{
        let recipe_data = req.body;
        let userID = req.userID;

        // generating unique id using the date time with milliseconds
        recipe_data.recipe_id = ((new Date()).valueOf()); 
        recipe_data.recipe_id = parseInt(recipe_data.recipe_id / 1000);
        let found = await crud.checkOnDBrecipe(recipe_data.recipe_id);
        //if the unique id accidentally exist in the DB
        while (found.length != 0) {
            recipe_data.recipe_id = ((new Date()).valueOf()); // generating again unique id using the date time with milliseconds
            let found = await crud.checkOnDBrecipe(recipe_data.recipe_id);
        }
        //Adding the new recipe to our DB
        await crud.addRecipeToDBFromAPI(recipe_data.recipe_id, recipe_data);
        //Adding to myRecipes table of the user
        await crud.execQuery(`INSERT INTO user_my_recipes VALUES ( '${recipe_data.recipe_id}' ,'${userID}')`);
        res.status(200).send({message: "Recipe added succssefully", success: true});
    }catch(err){
        next(err);
    }
});

// ------------- family --------------

//GET all family recipes of the user
router.get("/getFamilyRecipies" , async function (req, res, next) {
    try{
        let userID = req.userID;
        let family= await crud.getAllFamilyRecipes(userID);
        if(family.length === 0 ){
            throw {status: 404, message: "Not Found any family recipes" }; 
        }
        res.status(200).send(family);
    }catch(err){
        next(err);
    }
});

//get one family recipe of the user
router.get("/getOneFamilyRecipe/:recipeID" , async function(req,res,next) {
    try {
        const recipe_id = req.params.recipeID;
        let userID = req.userID;
        let family_recipe = await crud.getOneFamilyRecipes(userID,recipe_id);
        if (family_recipe.length == 0 || family_recipe == null){
            throw {status: 404, message: "family recipe has not found" }; 
        }
        res.status(200).send(family_recipe);
    }catch(err) {
        next(err);
    }
});

//POST a family recipe of user
router.post("/addFamilyRecipe" , async function (req, res, next) {
    try{
        let recipe_data = req.body;
        recipe_data.user_id = req.userID;
        let familyRecipes = await crud.addFamilyRecipeToUser(recipe_data);
        res.status(200).send({message: "Recipe add seccssefuly" , success: true});
    }catch(err){
        next(err);
    }
});


// ------------- last-seen ------------

//GET the last wathced recipes by the user
router.get("/getLastSeenRecipies" , async function (req, res, next) {
    try{
        let userID = req.userID;
        let last_seen = await crud.getThreeLastSeenRecipes(userID);
        if(last_seen.length === 0 ){
            throw {status: 404, message: "Not Found any seen recipes" }; 
        }
        res.status(200).send(last_seen);
    }catch(err){
        next(err);
    }
});
//POST update recipe to be seen by the user
router.post("/addLastSeenRecipe" , async function (req, res, next) {
    try{
        let recipeID = req.body.recipe_id;
        let userID = req.userID;
        // console.log(userID, recipeID);
        await crud.addRecipeToSeenOfUser(userID, recipeID);
        res.status(200).send({message: "Recipe add to seen seccssefuly", success: true});
    }catch(err){
        next(err);
    }
});

/**
 * return status 200 with isSeen true if tthe user already have seen this recipe
 * else will return status 200 with isSeen false
 */
router.get("/isRecipeAlreadySeen/:recipe_id", async function (req, res, next) {
    let flag = false;
    try {
        const { recipe_id } = req.params;
        allUserRecipes = await crud.getUserRecipeProps(req.userID);
        allUserRecipes.map((recipe) => {
            if (recipe.recipe_id == recipe_id) {
                if (recipe.seen == 1) {
                    flag = true;
                }
            }
        });
        if (flag) {
            res.status(200).send({isSeen: true});
        }else {
            res.status(200).send({isSeen: false});
        }
    } catch (err){
        next(err);
    }
});
// ----------- favourite ------------

//GET the favourites recipes of the user
router.get("/getFavoriteRecipies" , async function (req, res, next) {
    try{
        let userID = req.userID;
        let favourites = await crud.getUserFavourites(userID);
        // res.status(200).send(favourites);
        if(favourites.length === 0 ){
            throw {status: 404, message: "Not Found any favourite recipes" }; 
        }
        res.status(200).send(favourites);
    }catch(err){
        next(err);
    }
});
//POST add a recipe to user favourites
router.post("/addFavoriteRecipie" , async function (req, res, next) {
    try{
        let recipID = req.body.recipe_id;
        let userID = req.userID;
        await crud.addRecipeToUserFavourites(userID,recipID);
        res.status(200).send({message: "Recipe add to favourite seccssefuly", success: true});
    }catch(err){
        next(err);
    }
});

/**
 * return status 200 with isInFavourite true if tthe user already mark this recipe as a favourite
 * else will return status 200 with isInFavourite false
 */
router.get("/isRecipeAlreadyInFavourite/:recipe_id", async function (req, res, next) {
    try {
        const { recipe_id } = req.params;
        allUserRecipes = await crud.getUserRecipeProps(req.userID);
        allUserRecipes.map((recipe) => {
            if (recipe.recipe_id == recipe_id) {
                if (recipe.favourite == 1) {
                    res.status(200).send({isInFavourite: true});
                }
                else {
                    res.status(200).send({isInFavourite: false});
                }
            }
        });
    } catch (err){
        next(err);
    }
});

//POST remove recipe from user favourites
router.post("/removeFavoriteRecipie" , async function (req, res, next) {
    try{
        let recipID = req.body.recipe_id;
        let userID = req.userID;
        await crud.removeFromUserFavourites(userID,recipID);
        res.status(200).send({message: "Recipe removed from favourites seccssefuly", success: true});
    }catch(err){
        next(err);
    }
});

//get image from assets directory---> IMAGE MUST BE .png FORMAT!
// router.get("/getImage/:imgName", async function (req, res, next) {
//     try {
//         let img_name = req.params; // img_name sould comw with .type
//         //check if image exist
//         let img_path = './assets/' + img_name.imgName;
//         // console.log(fs.existsSync(img_path));
//         if (fs.existsSync(img_path)) {
//             res.set({'Content-Type': 'image/png'});
//             res.status(200).sendFile(path.join(__dirname, "../assets", img_name.imgName));
//         }else {
//             res.status(404).send({message: "File not found", success: false});
//         }
//     }catch(err) {
//         next(err);
//     }
// });

module.exports = router;
