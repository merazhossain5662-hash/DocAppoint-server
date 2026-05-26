const express = require('express');
const cors = require('cors')
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
const app= express();
dotenv.config();

app.use(cors())
app.use(express.json())

const PORT =process.env.PORT;
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


 const JWKS = createRemoteJWKSet(
      new URL('http://localhost:3000/api/auth/jwks')
    );

const tokenVerifyer = async(req, res, next)=>{
  const header = req?.headers.authorization
if(!header){
  return res.status(401).json({message : "unauthorized"})
}
  const token = header.split(" ")[1]


      const { payload } = await jwtVerify(token, JWKS, {
      issuer: 'http://localhost:3000', // Should match your JWT issuer, which is the BASE_URL
      audience: 'http://localhost:3000', // Should match your JWT audience, which is the BASE_URL by default
    })
  next()
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    
    const db = client.db("DocAppoint")

    const doctorsCollection = db.collection("doctors");
   const appoinmentsCollection = db.collection("appoinments");
    // to get all doctors data:
    app.get('/allDoctors',  async(req, res)=>{
     const data = await doctorsCollection.find().toArray();
     
     res.json(data)
    });
  
  //to get one data by _id
  app.get('/allDoctors/:id', tokenVerifyer, async(req, res)=>{
    const id = req.params.id
    
     const data = await doctorsCollection.findOne({_id: new ObjectId(id)})
 
     
     res.json(data)
    }); 

    // to add appoinments
    app.post('/appoinments', tokenVerifyer, async(req, res)=>{
      const data = req.body
      const adddData= await appoinmentsCollection.insertOne(data)
       res.json(adddData);
    });

   // to see the appoinments using email 
   app.get('/appoinments/:email', tokenVerifyer, async(req, res)=>{
    const {email} = req.params
     const data = await appoinmentsCollection.find({userEmail : email}).toArray()
      res.json(data)
   })

   //to delete appoinmet using _id
   app.delete('/appoinments/:id', tokenVerifyer, async(req, res)=>{
    const {id} = req.params
     const data = await appoinmentsCollection.deleteOne({_id: new ObjectId(id)})
      res.json(data)
   })

   //to update appoinment using id
   app.patch('/appoinments/:id', tokenVerifyer, async(req, res)=>{
    const {id} = req.params
    const updatedData =req.body
     const data = await appoinmentsCollection.updateOne({_id: new ObjectId(id)},
    {$set: updatedData}
    )
      res.json(data)
   })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req,res)=>{
   res.send("server is running succesfully")
})

app.listen(PORT, ()=>{
    console.log(`server running on port ${PORT}`);
    
})