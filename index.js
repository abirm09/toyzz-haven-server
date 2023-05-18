const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
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

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

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
