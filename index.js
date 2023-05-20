const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

//middleware
app.use(cors());
app.use(express.json());

//db management

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.BD_PASS}@cluster0.v6yry4e.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//verifyJWT
const verifyJWT = (req, res, next) => {
  const authenticate = req.headers.authenticate;
  if (!authenticate) {
    return res.send({ error: true, message: "Un authorize user." });
  }
  const token = authenticate.split(" ")[1];
  jwt.verify(token, process.env.ACCESSTOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.send({ error: true, message: "Un authorize user." });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();

    const allToys = client.db("toyzzHaven").collection("allToys");
    //get all toys
    app.get("/toys/all", async (req, res) => {
      const result = await allToys.find().toArray();
      res.send(result);
    });
    //get all categories
    app.get("/categories", (req, res) => {
      const category = ["Marvel", "Avengers", "Star Wars"];
      res.send(category);
    });
    //get toys by categories
    app.get("/toy/category", async (req, res) => {
      const cat = req.query.category;
      const query = { subcategory: { $regex: cat, $options: "i" } };
      const result = await allToys.find(query).toArray();
      res.send(result);
    });
    app.get("/toys/limit20", async (req, res) => {
      const result = await allToys.find().limit(20).toArray();
      res.send(result);
    });
    //get data by product id
    app.get("/toy/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await allToys.findOne(query);
      res.send(result);
    });
    //get toys by name
    app.get("/toys/search", async (req, res) => {
      const searchParam = req.query.search;
      const query = { toy_name: { $regex: searchParam, $options: "i" } };
      const result = await allToys.find(query).limit(20).toArray();
      res.send(result);
    });
    //get random three
    app.get("/toys/randomThree", async (req, res) => {
      const query = { $sample: { size: 3 } };
      const result = await allToys.aggregate([query]).toArray();
      res.send(result);
    });
    //get added toys
    app.post("/toy/getMyToy", verifyJWT, async (req, res) => {
      const email = req.body.email;
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.send({ error: true, message: "Un authorize user." });
      }
      const query = { email };
      const result = await allToys.find(query).toArray();
      res.send(result);
    });
    //get toy by sorting
    app.post("/toy/sort", verifyJWT, async (req, res) => {
      const email = req.body.email.email;
      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res.send({ error: true, message: "Un authorize user." });
      }
      const query = { email };
      const result = await allToys
        .find(query)
        .sort({ price: req.body.value })
        .toArray();
      res.send(result);
    });
    //get jwt
    app.post("/jwt", (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.ACCESSTOKEN_SECRET, {
        expiresIn: "5h",
      });
      res.send({ token });
    });

    //store new toy
    app.post("/toy/add", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const body = req.body;
      if (decodedEmail !== body.email) {
        return res.send({ error: true, message: "Un authorize user." });
      }
      const result = await allToys.insertOne(body);
      res.send(result);
    });

    //update a toy
    app.put("/toy/update", verifyJWT, async (req, res) => {
      const body = req.body;
      const email = body.email;
      if (req.decoded.email !== email) {
        return res.send({ error: true, message: "Un authorize user." });
      }
      const filter = { _id: new ObjectId(body.id) };
      const updateDoc = {
        $set: body.toyDetails,
      };
      const options = { upsert: true };
      const result = await allToys.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    //delete a toy
    app.delete("/toy/delete", verifyJWT, async (req, res) => {
      const id = req.query.id;
      const query = { _id: new ObjectId(id) };
      const result = await allToys.deleteOne(query);
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

//test api
app.get("/", (req, res) => {
  res.send([`Server is running at port : ${port}`]);
});

app.listen(port, () => {
  console.log(`Server is started at port ${port}`);
});
