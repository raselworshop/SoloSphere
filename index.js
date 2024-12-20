const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
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

    const jobsCollection = client.db('soloSphere').collection('jobs');
    const bidsCollection = client.db('soloSphere').collection('bids')

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
    // get the jobs posted by the specific user 
    app.get('/user/posted-job/:email', async (req, res) => {
      const email = req.params.email;
      try {
        // const postedJobs = await jobsCollection.find({ 'buyer.email': email }).toArray();
        const query = { 'buyer.email': email };
        const postedJobs = await jobsCollection.find(query).toArray();
        res.send(postedJobs)
      } catch (error) {
        console.error('Error fetching posted jobs:', error);
        res.status(500).send({ message: 'Internal Server Error' });
      }
    })
    // get a single job data by id for update the job 
    app.get('/update/job/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      try {
        const result = await jobsCollection.findOne(query)
        // console.log(result)
        if (result) {
          res.send({ message: 'Job fetched successfully', result });
        } else {
          res.status(404).send({ message: 'Job not found' });
        }
      } catch (error) {
        console.error('Error fetching job:', error);
        res.status(500).send({ message: 'Internal Server Error' });
      }

    })
    // insert updated data to db 
    app.put('/recruiter/update-job/:id', async (req, res) => {
      const id = req.params.id;
      const jobData = req.body;
      // console.log(jobData)
      const query = { _id: new ObjectId(id) }
      const updated = {
        $set: jobData,
      }
      const options = { upsert: false }
      try {
        const result = await jobsCollection.updateOne(query, updated, options);
        // console.log('The result is: ',result)
        res.send(result)
      } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).send({ message: 'Internal Server Error' });
      }
    })
    // delete a job from db 
    app.delete('/posted-job/delete/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      try {
        const result = await jobsCollection.deleteOne(query)
        // console.log(result)
        if (result.deletedCount === 1) {
          res.send({ message: 'Job successfully deleted', result });
        } else {
          res.status(404).send({ message: 'Job not found' });
        }
      } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).send({ message: 'Internal Server Error' });
      }
    })
    // save bid in db 
    app.post('/client/add-bid', async (req, res) => {
      //1 save bids data in bidsCollection
      const bidData = req.body;
      // check if the user already bid in the job 
      const query = {email: bidData.email, bidId: bidData.bidId};
      const alreadyExist = await bidsCollection.findOne(query)
      console.log(alreadyExist)
      if(alreadyExist){
        return res.status(400).send({message:"You have already bid on this project!"})
      }
      // console.log(bidData)
      const result = await bidsCollection.insertOne(bidData);

      //2 increase bids count in jobs collection
      const filter = {_id: new ObjectId(bidData.bidId)} 
      console.log(filter)
      const update = {
        $inc:{bid_count: 1}
      }
      const updateBidCount = await jobsCollection.updateOne(filter, update)
      res.send(result)
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
