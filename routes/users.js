require("dotenv").config();
var express = require("express");
var router = express.Router();
const axios = require("axios");

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
router.get("/myRecipies" , async function (req, res, next) {
    try{
        let userID = req.body.user_id;
        let recipes= await crud.getAllUserRecipes(userID);
        if(recipes.length === 0 ){
            throw {status: 404, message: "Not Found any recipes" }; 
        }
        res.status(200).send(recipes);
    }catch(err){
        next(err);
    }
});
//======================================================================
//POST user recipe
router.post("/myRecipies" , async function (req, res, next) {
    try{
        let recipe_data = req.body;
        await crud.execQuery(`INSERT INTO user_recipe VALUES ( '${recipe_data.recipe_id}' ,'${req.userID}' ,  '0' , '0')`);
        res.status(200).send({message: "Recipe add seccssefuly", success: true});
    }catch(err){
        next(err);
    }
});

// ------------- family --------------

//GET the family recipes of the user
router.get("/familyRecipies" , async function (req, res, next) {
    try{
        let userID = req.body.user_id;
        let family= await crud.getAllFamilyRecipes(userID);
        if(family.length === 0 ){
            throw {status: 404, message: "Not Found any family recipes" }; 
        }
        res.status(200).send(family);
    }catch(err){
        next(err);
    }
});
//POST a family recipe of user
router.post("/familyRecipies" , async function (req, res, next) {
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
router.get("/lastRecipies" , async function (req, res, next) {
    try{
        let userID = req.body.user_id;
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
router.post("/lastRecipies" , async function (req, res, next) {
    try{
        let recipeID = req.body.recipe_id;
        let userID = req.userID;
        console.log(userID, recipeID);
        await crud.addRecipeToSeenOfUser(userID, recipeID);
        res.status(200).send({message: "Recipe add to seen seccssefuly", success: true});
    }catch(err){
        next(err);
    }
});


// ----------- favourite ------------

//GET the favourites recipes of the user
router.get("/favoriteRecipies" , async function (req, res, next) {
    try{
        let userID = req.body.user_id;
        let favourites = await crud.getUserFavourites(userID);
        res.status(200).send(favourites);
        if(favourites.length === 0 ){
            throw {status: 404, message: "Not Found any favourite recipes" }; 
        }
        res.status(200).send(favourites);
    }catch(err){
        next(err);
    }
});
//POST add a recipe to user favourites
router.post("/favoriteRecipies" , async function (req, res, next) {
    try{
        let recipID = req.body.recipe_id;
        let userID = req.userID;
        await crud.addRecipeToUserFavourites(userID,recipID);
        res.status(200).send({message: "Recipe add to favourite seccssefuly", success: true});
    }catch(err){
        next(err);
    }
});

module.exports = router;
