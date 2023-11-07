const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.t2hcl8v.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const roomCollection = client.db("murnHotel").collection("rooms");
    const bookingCollection = client.db("murnHotel").collection("bookings");

    // middleware
    const gateman = (req, res, next) => {
      const { token } = req.cookies;
      console.log(token);

      //if client does not send token
      if (!token) {
        return res.status(401).send({ message: "You are not authorized" });
      }

      //verified token
      jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
            if (err) {
            return res.status(401).send({ message: "You are not authorized" });
          }
          req.user = decoded;
          next();
        }
      );
    };

    //JWT Auth API
    app.post("/token", gateman, async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
          sameSite: "none",
        })
        .send({ success: true });
    });

    //Bookings Related API
    app.get("/rooms", gateman, async (req, res) => {
      const rooms = await roomCollection.find().toArray();
      res.send(rooms);
    });

    app.post("/user/create-bookings", async (req, res) => {
      // console.log(req.body);
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    app.delete("/user/cancel-booking/:id", async (req, res) => {
      // console.log(req.params);
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    //user specific booking
    app.get("/user/bookings", gateman, async (req, res) => {
      // console.log(req);
      const queryEmail = req.query.email;
      const tokenEmail = req.user.email;

      //at first check its match or not
      if (queryEmail !== tokenEmail) {
        return res.status(403).send({message: 'Forbidden access'})
      }
        //match user email to check it is valid user
        let query = {} //if dont have email, its send all data

        if(queryEmail){
            query.email = queryEmail
        }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Murn Inn Server is running");
});

app.listen(port, () => {
  console.log(`Murn Inn server running port on: ${port}`);
});
