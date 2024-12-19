const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb')
require('dotenv').config()

const port = process.env.PORT || 5000;
const app = express()

app.use(cors())
app.use(express.json())

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@main.yolij.mongodb.net/?retryWrites=true&w=majority&appName=Main`
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5hy3n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})

async function run() {
  try {

    const jobsCollection = client.db('soloSphere').collection('jobs')

    // save jobs in db 
    app.post('/recruiter/add-job', async (req, res) => {
      const jobData = req.body;
      // console.log(jobData)
      const result = await jobsCollection.insertOne(jobData);
      // console.log('The result is: ',result)
      res.send(result)
    })
    // get all jobs data from db 
    app.get('/jobs', async (req, res) => {
      try {
        const result = await jobsCollection.find().toArray();
        res.send(result)
        // console.log(result)
        
      } catch (error) {
        console.error('Error fetching jobs:', error); 
        res.status(500).send({ message: 'Internal Server Error' });
      }
    })
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 })
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    )
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir)
app.get('/', (req, res) => {
  res.send('Hello from SoloSphere Server....')
})

app.listen(port, () => console.log(`Server running on port ${port}`))
