//imports
require("dotenv").config();
const sql = require("mssql");
const SqlString = require('sqlstring');
const escapeString = require('sql-string-escape');

const { v1: uuidv1 } = require('uuid');
uuidv1();

//set up configurations
const config = {
    user: process.env.tedious_userName,
    password: process.env.tedious_password,
    server: process.env.tedious_server,
    database: process.env.tedious_database,
    connectionTimeout: 1000000,
    options: {
      encrypt: true,
      enableArithAbort: true
    }
};

process.on("SIGINT", function () {
if (pool) {
    pool.close(() => console.log("connection pool closed"));
}
});
  
const pool = new sql.ConnectionPool(config);
const poolConnect = pool
.connect()
.then(() => console.log("new connection pool Created"))
.catch((err) => console.log(err));

//Execute generic query function
exports.execQuery = async function (query) {
    await poolConnect;
    try {
      var result = await pool.request().query(query);
      return result.recordset;
    } catch (err) {
      console.error("SQL error", err);
      throw err;
    }
  }
exports.execQuery().catch((err) => console.log(`Error occured while executing query with ${err}`));


//user existence validation
exports.getUserByID = async function(user_id) {
    return (await this.execQuery("SELECT * FROM users WHERE user_id LIKE '" + {user_id}) + "'");
}

//recive User by username
exports.getUserByUsername = async function(username){
  return await this.execQuery("SELECT * FROM users WHERE username LIKE '" + username + "'");
}

//recive user favourites recipes
exports.getUserFavourites = async function(user_id){
  let recipes_id =  await this.execQuery("SELECT recipe_id FROM user_recipe WHERE user_id LIKE '" + user_id + "' AND favourite = 1");
  return this.getRecipesInfo(recipes_id);
}

//-----INSERTIONS-----

//insert new recipe to favourites of a user
exports.addRecipeToUserFavourites = async function (user_id,recipe_id){
    //checking if the recipe is already exist in the favourite list of the user
    let recipe = await this.execQuery("SELECT * FROM user_recipe WHERE user_id LIKE '" + user_id + "' AND recipe_id LIKE '" + recipe_id + "'");
    if (recipe == null || recipe.length == 0) {
        let recipe = await this.execQuery("INSERT INTO user_recipe VALUES ('" + recipe_id + "', '" + user_id + "',0,1)");
    }
    else{
        let recipe = await this.execQuery("UPDATE user_recipe SET favourite = 1 WHERE user_id LIKE '" + user_id + "' AND recipe_id LIKE '" + recipe_id + "'");
    }
    return recipe;
}

//remove recipe from user favourites
exports.removeFromUserFavourites = async function(user_id,recipe_id) {
  let recipe = await this.execQuery("UPDATE user_recipe SET favourite = 0 WHERE user_id LIKE '" + user_id + "' AND recipe_id LIKE '" + recipe_id + "'");
  return recipe;
}

//insert new recipe to 'seen' of a user 
exports.addRecipeToSeenOfUser = async function (user_id, recipe_id) {
    let recipe = await this.execQuery("SELECT * FROM user_recipe WHERE user_id LIKE '" + user_id + "' AND recipe_id LIKE '" + recipe_id + "'");
    if (recipe == null || recipe.length == 0) {
        let recipe = await this.execQuery("INSERT INTO user_recipe VALUES ('" + recipe_id + "', '" + user_id + "',1,0, SYSDATETIME())");

    }
    else{
        let recipe = await this.execQuery("UPDATE user_recipe SET seen = 1 WHERE user_id LIKE '" + user_id + "' AND recipe_id LIKE '" + recipe_id + "'")

    }
    return recipe;
}

//insert new family recipe to user
exports.addFamilyRecipeToUser = async function (recipe_data) {
    let familyRecipe = await this.execQuery(`INSERT INTO family_recipes VALUES (NEWID() , '${recipe_data.user_id}' , '${recipe_data.recipe_name}' ,
    '${recipe_data.chef}' , '${recipe_data.occasion_time}' , '${recipe_data.recipe_img}', '${recipe_data.instructions}') `);
      //NOTE: ingredients must by array of object
    let recipe = await this.execQuery(`SELECT recipe_id FROM family_recipes WHERE user_id LIKE '${recipe_data.user_id}' AND recipe_name LIKE '${recipe_data.recipe_name}' `);
    console.log(recipe[0].recipe_id);
    recipe_data.ingredients.map(async (ingredient) => {await this.execQuery(`INSERT INTO family_recipe_ingredients VALUES ('${recipe[0].recipe_id}',
      '${ingredient.ingredient_name}','${ingredient.ingredient_evaluate_unit_survey}','${ingredient.ingredient_amount}')`)});
      return recipe;
}

exports.addRecipeToDBFromAPI = async function (recipe_id, recipe) {
  //Insert recipe into dbo.recipes
  //TODO - removed publisher since it is onlt table of recipes
 let instructions = escapeString(recipe.information.instructions);
 let recipeToInsert =  await this.execQuery(`INSERT INTO recipes VALUES ('${recipe_id}' ,'${recipe.information.title}',
    '${recipe.information.readyInMinutes}' , '${recipe.information.vegetarian}' , '${recipe.information.vegan}' , '${recipe.information.glutenFree}' , '${recipe.information.likes}' , '${recipe.information.image}', ${instructions}) `);
  //Insert ingrediaents into dbo.recipe_ingrediaents

  recipe.ingredients.map(async (ingredient) => 
  {  
    //Check if the recipe and ingredients are existing 
    let answer =  await this.execQuery(`SELECT * FROM recipe_ingredients WHERE recipe_id LIKE '${recipe_id}' AND ingredient_name LIKE '${ingredient.ingredient_name}'`);
    if (answer.length == 0) {
      await this.execQuery(`INSERT INTO recipe_ingredients VALUES ('${recipe_id}',
      '${ingredient.ingredient_name}','${ingredient.ingredient_evaluate_unit_survey}','${ingredient.ingredient_amount}')`)
    }
  });

  //Insert instructions into dbos.recipe_instructions
  recipe.analyzedInstructions.map(async (instruction) => 
  {
    //Check if the recipe and ingredients are existing 
    let answer =  await this.execQuery(`SELECT * FROM recipe_instructions WHERE recipe_id LIKE '${recipe_id}' AND stage_number LIKE '${instruction.stage_number}'`);
    if (answer.length == 0) {
      await this.execQuery(`INSERT INTO recipe_instructions VALUES ('${recipe_id}',
        '${instruction.stage_number}','${instruction.stage_description}')`)
    }
  });
}

//insert new user to the db
exports.addNewUser = async function (user){
  let newUser = await this.execQuery(`INSERT INTO users VALUES (NEWID() , '${user.username}' , '${user.password}' , '${user.first_name}' , '${user.last_name}' , '${user.email}' , '${user.profile_picture_url}')`)
}

//-----READING-----

exports.checkOnDBrecipe = async function (recipe_id) {
  return await this.execQuery(`SELECT * FROM recipes WHERE recipe_id LIKE '${recipe_id}'`);
}

//recieve user recipes properties information
exports.getUserRecipeProps = async function (user_id) {
    return (await this.execQuery("SELECT recipe_id,seen,favourite FROM user_recipe WHERE user_id LIKE '" + user_id + "'"));
}

//recieve 3 last seen recpies by a user
exports.getThreeLastSeenRecipes = async function(user_id) {
    let ids = (await this.execQuery("SELECT TOP (3) recipe_id FROM user_recipe WHERE user_id LIKE '" + user_id + "' AND seen = 1 ORDER BY date_seen DESC"));
    const recipes = ids.map((recipe) => this.getLastSeenRecipeInfo(recipe));
    return await Promise.all(recipes);
}

//return the neccassary information on the last seen recipe preview
exports.getLastSeenRecipeInfo = async function(element) {
  return await this.execQuery(`SELECT recipe_id,recipe_name,cooking_time,popularity,image_url FROM recipes WHERE recipe_id LIKE ${element.recipe_id}`);
}

//recive all family recipes
exports.getAllFamilyRecipes = async function(user_id){
  let family_recipes =  (await this.execQuery("SELECT recipe_id,recipe_name,chef,occasion_time,readyInMinutes,recipe_img,instructions FROM family_recipes WHERE user_id LIKE '" + user_id + "'"));
  const family_recipes_info = family_recipes.map((recipe) => this.extractFamilyRecipeIngredients(recipe));
  return await Promise.all(family_recipes_info);
}

//Extract relevent data for family recipe ingredients
exports.extractFamilyRecipeIngredients = async function(recipe) {
  let ingredients = await this.execQuery("SELECT ingredient_name,ingredient_evaluate_unit_survey,ingredient_amount FROM family_recipe_ingredients WHERE recipe_id LIKE " + recipe.recipe_id);
  recipe.ingredients = ingredients;
  return recipe;
}

//recive one family recipe
exports.getOneFamilyRecipes = async function(user_id, recipe_id){
  let family_recipe =  (await this.execQuery("SELECT * FROM family_recipes WHERE user_id LIKE '" + user_id + "' AND recipe_id LIKE '" + recipe_id + "'"));
  let family_ingredients = await this.execQuery(`SELECT ingredient_name,ingredient_evaluate_unit_survey,ingredient_amount FROM family_recipe_ingredients WHERE recipe_id LIKE ${recipe_id}`);
  family_recipe[0].ingredients = family_ingredients;
  family_recipe[0].user_id = undefined;
  return family_recipe;
}

//recive one recipe info --> look at the function getRecipeTotalInfo before using
exports.getRecipeInfo = async function (recipeID) {
    return await this.execQuery("SELECT * FROM recipes WHERE recipe_id LIKE '" + recipeID + "'");
}

//get recipes info - list of recipes id
exports.getRecipesInfo = async function(recipes_id){
  let fav_Respies = [];
  if (recipes_id.length === 0){
    throw {status: 404, message: "Not Found recipes" }; 
  }
  for(let i=0; i<recipes_id.length; i++){
    let recipe = await this.execQuery("SELECT * FROM recipes WHERE recipe_id LIKE '" + recipes_id[i].recipe_id + "'");
    fav_Respies.push(recipe[0]);
  } 
  return fav_Respies;
  // return recipes_id;
}

//recive the ingredients of a user's recipe
exports.getUserRecipeIngredients = async function(recipe_id){
  return await this.execQuery("SELECT * FROM recipe_ingredients WHERE recipe_id LIKE '" + recipe_id + "'");
}

//recieve all user's recipes
exports.getAllUserRecipes = async function(user_id){
  let recipes_ids =  await this.execQuery("SELECT recipe_id FROM user_my_recipes WHERE user_id LIKE '" + user_id + "'");
  const allRecipes = recipes_ids.map((id) => this.execQuery(`SELECT * FROM recipes WHERE recipe_id LIKE ${id.recipe_id}`));
  return await Promise.all(allRecipes);
}

//recieve recipe ingredients
exports.getRecipeIngredients = async function (recipeID) {
    return await this.execQuery(`SELECT * FROM recipe_ingredients WHERE recipe_id LIKE '${recipeID}'`);
}

//recieve recipe instructions
exports.getRecipeInstructions = async function (recipeID) {
    return await this.execQuery(`SELECT * FROM recipe_instructions WHERE recipe_id LIKE '${recipeID}'`);
}

//recieve recipe total info including ingredients and instructions
exports.getRecipeTotalInfo = async function (recipeID) {
    let recipe = await this.getRecipeInfo(recipeID);
    recipe.ingredients = await this.getRecipeIngredients(recipeID);
    recipe.instructions = await this.getRecipeInstructions(recipeID);
    return recipe;
}
