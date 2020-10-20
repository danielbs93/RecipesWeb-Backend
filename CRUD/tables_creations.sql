CREATE TABLE [dbo].[users](
	[user_id] [UNIQUEIDENTIFIER] PRIMARY KEY NOT NULL default NEWID(),
	[username] [varchar](30) NOT NULL UNIQUE,
	[password] [varchar](300) NOT NULL,
	[first_name] [varchar](300) NOT NULL,
	[last_name] [varchar](300) NOT NULL,
	[email] [varchar](300) NOT NULL,
	[profile_picture_url] [varchar](1000) NOT NULL
)

CREATE TABLE [dbo].[recipes](
	[recipe_id] [int] PRIMARY KEY NOT NULL,
	-- [publisher] [UNIQUEIDENTIFIER] FOREIGN KEY REFERENCES users(user_id) NOT NULL,
	[recipe_name] [varchar](300) NOT NULL,
	[cooking_time] [int] NOT NULL,
	[vegeterian] [int] NOT NULL,
	[vegan] [int] NOT NULL,
	[gluten_free] [int] NOT NULL,
	[popularity] [int] NOT NULL,
	[instructions] varchar(5000),	
	[image_url] [varchar](1000) NOT NULL,
)

CREATE TABLE [dbo].[user_recipe](
	[recipe_id] [int] NOT NULL,
	[user_id] [UNIQUEIDENTIFIER] NOT NULL,
	[seen] [int] NOT NULL,
	[favourite] [int] NOT NULL,
	[date_seen] varchar(300) NOT NULL DEFAULT SYSDATETIME(),
	FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id),
	FOREIGN KEY (user_id) REFERENCES users(user_id),
	PRIMARY KEY (recipe_id, user_id)
)

CREATE TABLE [dbo].[user_my_recipes](
	[recipe_id] [int] NOT NULL,
	[user_id] [UNIQUEIDENTIFIER] NOT NULL,
	FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id),
	FOREIGN KEY (user_id) REFERENCES users(user_id),
	PRIMARY KEY (recipe_id, user_id)
)

CREATE TABLE [dbo].[family_recipes](
	[recipe_id] [int] NOT NULL,
	[user_id] [UNIQUEIDENTIFIER] NOT NULL,
	[recipe_name] [varchar](300) NOT NULL,
	[chef] [varchar](300) NOT NULL,
	[occasion_time] [varchar](300) NOT NULL,
	[readyInMinutes] [varchar] (300) NOT NULL,
    [recipe_img] [varchar](300) NOT NULL,
	[instructions] [varchar](2000) NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(user_id),
	PRIMARY KEY (recipe_id)
)

CREATE TABLE [dbo].[family_recipe_ingredients](
	[recipe_id] [int] NOT NULL,
	[ingredient_name] [varchar](300) NOT NULL,
    [ingredient_evaluate_unit_survey] [varchar](300) NOT NULL,
    [ingredient_amount] [varchar](300) NOT NULL,
	FOREIGN KEY (recipe_id) REFERENCES family_recipes(recipe_id),
    PRIMARY KEY (ingredient_name, recipe_id)
)

CREATE TABLE [dbo].[recipe_ingredients](
	[recipe_id] [int] NOT NULL,
	[ingredient_name] [varchar](300) NOT NULL,
    [ingredient_evaluate_unit_survey] [varchar](300) NOT NULL,
    [ingredient_amount] [varchar](300) NOT NULL,
    PRIMARY KEY (ingredient_name, recipe_id)
)

CREATE TABLE [dbo].[recipe_instructions] (
	[recipe_id] [int] NOT NULL,
    [stage_number] [varchar](300) NOT NULL,
    [stage_description] [varchar](8000) NOT NULL,
    PRIMARY KEY (stage_number, recipe_id)
)

CREATE TABLE [dbo].[cuisine](
	[cuisine_id] [UNIQUEIDENTIFIER] PRIMARY KEY NOT NULL default NEWID(),
	[cuisine_name] [varchar](300) NOT NULL
)

CREATE TABLE [dbo].[recipes_cuisine](
	[cuisine_id] [UNIQUEIDENTIFIER] NOT NULL,
	[recipe_id] [int]  NOT NULL,
	FOREIGN KEY (cuisine_id) REFERENCES cuisine(cuisine_id),
	FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id),
	PRIMARY KEY (cuisine_id, recipe_id)
)

CREATE TABLE [dbo].[diet](
	[diet_id] [UNIQUEIDENTIFIER] PRIMARY KEY NOT NULL default NEWID(),
	[diet_name] [varchar](300) NOT NULL
)

CREATE TABLE [dbo].[recipes_diet](
	[diet_id] [UNIQUEIDENTIFIER] NOT NULL,
	[recipe_id] [int] NOT NULL,
	FOREIGN KEY (diet_id) REFERENCES diet(diet_id),
	FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id),
	PRIMARY KEY (diet_id, recipe_id)
)

CREATE TABLE [dbo].[intolerance](
	[intolerance_id] [UNIQUEIDENTIFIER] PRIMARY KEY NOT NULL default NEWID(),
	[intolerance_name] [varchar](300) NOT NULL
)

CREATE TABLE [dbo].[recipes_intolerance](
	[intolerance_id] [UNIQUEIDENTIFIER] NOT NULL,
	[recipe_id] [int] NOT NULL,
	FOREIGN KEY (intolerance_id) REFERENCES intolerance(intolerance_id),
	FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id),
	PRIMARY KEY (intolerance_id, recipe_id)
)




