var express = require("express");
var router = express.Router();
const crud = require("../CRUD/DB_operations");
const { v1: uuidv1 } = require("uuid");
const bcrypt = require("bcryptjs");


//handles registeration 
router.post("/register", async function (req, res, next) {
    // console.log(user_data);
    try{
        let user_data = req.body;
        let users = await crud.execQuery("SELECT * FROM dbo.users");
        if (users.find((user) => user.username === user_data.username)){
            // res.send("Username already used");
            console.log(user_data,"user");
            throw {status: 401, message: "Username already used" };
        }
        else if (users.find((user) => user.email === user_data.email)){
            // res.send("Email address already exists.  Login or use different one");
            console.log(user_data,"mail");
            throw {status: 401, message: "Email address already exists.  Login or use different one" };
        }
        else {
            console.log(user_data,"sucseess");
            let hash = bcrypt.hashSync(
                req.body.password,
                parseInt(process.env.bcrypt_saltRounds)
              );
            req.body.password = hash;
            await crud.addNewUser(user_data);
            res.status(201).send({message: "User created seccssefuly", success: true});
            
        }
    }catch(err){
        next(err);
    }
});

//handles login
router.post("/login" , async function (req, res, next) {
    try {
        let users = await crud.execQuery("SELECT username FROM dbo.users");
        if (!users.find((user) => user.username === req.body.username))
            throw {status: 401, message: "Username or password incorrect" };

        let user = (await crud.execQuery("SELECT * FROM dbo.users WHERE username LIKE '" + req.body.username +"'"))[0];
        // res.send({message: user});

        if (!bcrypt.compareSync(req.body.password, user.password)) {
            throw {status: 401, message: "Username or password incorrect" };
        }

        req.session.user_id = user.user_id;
        res.status(200).send({
            message: "Login succeeded",
            success: true,
        });
        console.log("------------///////////////------LOGIN--------///////////////------------/" + req.session.user_id);
    } catch (err) {
        console.log(err);
        next (err);
    }

});

//handles logout
router.post("/logout", function (req, res) {
    req.session.reset(); // reset the cookie session of a logged in user
    res.send({ success: true, message: "You have successfullt logged out!" });
  });

  router.post("/signin", async function (req, res, next) {
    res.send({ success: true, message: this.req.body.username + "Yousv sfv sf have successfullt logged in!" });
  });
  
module.exports = router;