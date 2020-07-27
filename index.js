// Letting all origins to pass
const cors = require("cors");

const corsConfig = {
    origin: true,
    credentials: true
};


//----Importing the libraries
const express = require("express");// Server module
const bodyParser = require("body-parser");// Requests parser module
const morgan = require("morgan");// Logger module
const session = require("client-sessions"); // Authentication module
const crud = require("./CRUD/DB_operations");

//----Routes importing here
const auth = require("./routes/auth");
const recipes = require("./routes/recipes");
const users = require("./routes/users");

//----App settings and config
const app = express();
const port = process.env.PORT || "4000";

app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());
app.use(morgan(":method :url :status :response-time ms"));

//Cross origin definition 
app.use(cors(corsConfig));
app.options("*", cors(corsConfig));

//Session settings
app.use (
    session({
        cookieName: "session", // cookie name
        secret: process.env.COOKIE_SECRET, //encryption key
        duration: 60*30*1000, // expires after 1800 seconds
        activeDuration: 0, //if expiresIn < activeDuration the session will be extended by activeDuration (ms)
        cookie: {
            httpOnly: false,
        },
    })
);

//Cookie middleware
app.use(async function(req, res, next) {
    // console.log("-----------------------||||||||||||||||||+---AliveChecker---||||||||||||||||--" + req.session.user_id);
    if (req.session && req.session.user_id) {
        let user_exist = await crud.execQuery(`SELECT user_id FROM users WHERE user_id LIKE '${req.session.user_id}'`);
        if (user_exist) {
            req.userID = (req.session.user_id).toLowerCase();
            // console.log("-----------------------++++++++++++++++---AliveChecker2---++++++++++++++++++++--" + req.session.user_id);
        }
        next();
    } else {
        next();
    }
});

// //Cookie middleware
// app.use(function(req, res, next) {
//     console.log("-----------------------" + req.session.user_id);
//     if (req.session && req.session.user_id) {
//         crud.execQuery("SELECT user_id FROM users")
//             .then((users) => {
//                 if (users.find((x) => x.user_id === req.session.user_id)) {
//                     req.userID = req.session.user_id;
//                 }
//                 next();
//             })
//             .catch((error) => next());
//     } else {
//         next();
//     }
// });

//----Checking if the server is alive
app.get ("/alive", (req,res) => {
    res.send("I'm alive!");
});

//----Routing
app.use("/users", users);
app.use("/recipes",recipes);
app.use("/auth", auth);

// Defualt router
app.use((req,res) => {
    res.sendStatus(404);
});

//Throwing the error into response after next is done to an error
app.use(function (err, req, res, next) {
    res.status(err.status || 500).send({message: err.message, success: false});
})

const server = app.listen(port, () => {
    console.log(`App listening on port ` + port);
});

//closing the process in case server is down
process.on("SIGINT", function () {
    if (server) {
        server.close(() => console.log("server is closed"))
    }
    process.exit()
});


