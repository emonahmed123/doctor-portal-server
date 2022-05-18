const express = require('express')
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const app =express();
const port =process.env.PROT || 5000


  app.use(cors());
   app.use(express.json());




const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6lyyw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  // console.log(authHeader)
  const token = authHeader.split(' ')[1];
  
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
  //  console.log(decoded)
   
   if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
  
    req.decoded = decoded;
    next();
  });
}


async function run(){
try{
  await client.connect() ;
  const serviceCollection =client.db('doctor_portal').collection('services')
  const bookingCollection =client.db('doctor_portal').collection('bookings')
  const userCollection =client.db('doctor_portal').collection('users')


     app.get('/service', async(req , res)=>{
         const query ={}
         const cursor =serviceCollection.find(query)
        const services = await cursor.toArray()
        res.send(services)
     });


    //  all user 
    app.get('/user',verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

     app.get('/admin/:email',async(req,res)=>{
             const email =req.params.email
             const user =await userCollection.findOne({email:email})
              const isAdmin =user.role ==='admin'
              res.send({admin:isAdmin})

     })

     

       
    app.put('/user/admin/:email',verifyJWT,async(req,res)=>{
      // const email = req.params.email;
      // const filter = {email: email};
      //  const updateDoc ={
      //    $set :{role:'admin'},
      //  };
      //  const result =await userCollection.updateOne(filter,updateDoc)
      //   const token =jwt.sign({email:email}, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
      //  res.send({ result ,token});
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({ email: requester });
      if (requesterAccount.role === 'admin') {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: 'admin' },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      }
      else{
        res.status(403).send({message: 'forbidden'});
      }
    
    
    
    
    
    
    });




        app.put('/user/:email',async(req,res)=>{
          const email = req.params.email;
          const user = req.body
          const filter = {email: email};
          const options ={upsert: true};
           const updateDoc ={
             $set : user,
           };
           const result =await userCollection.updateOne(filter, updateDoc , options)
            const token =jwt.sign({email:email}, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
           res.send({ result ,token});
          });




// this is not the proper way to query  after leatning more about mongodb use. aggregate ,lookup ,pipelind,match
   app.get('/available',async(req,res)=>{
     const date= req.query.date ;
 
     // step1: get aall services
     const services = await serviceCollection.find().toArray( )
      // step 2: get the booking of that day out[{},{},{} {} {}]
      const query ={date:date};
     const bookings = await bookingCollection.find(query).toArray()
      // step3 : for each service find bookings for that service.
      // services.forEach(service =>{
      //    const serviceBookings =bookings.filter(b=>b.treatment === service.name)
      //    const booked = serviceBookings.map(s=>s.slot);
      //    const available =service .slots.filter(s=>!booked.includes(s)) 
      //    // service.booked =booked
      //       // service.booked =serviceBookings.map(s=>s.slot)
      // //        service.available =available
      //     })
  services.forEach( service=>{
     // stpes 4find booking for that service , output :[{},{},{}]
     const serviceBookings = bookings.filter(book=>book.treatment ===service.name)
         //step  5: select slots for the service Bookings:[ ' '  ''  ' ]
         const bookSlots =serviceBookings.map(book=>book.slot)
     
        // step 6:select those slots that are not in bookslots
   const  available =service .slots.filter(slot =>  !bookSlots.includes(slot) )
        service.slots =available  
       })
     res.send(services)
    })  ;
 /**
  * API nameing Convention
  * app.get.('/booking) // get all bookings in this collection.or get more than  one or by fitler
  * app.get('/booking/:id')  // get a specitfic booking
  * app.post(booking) // add a new  booking
  * app.patch(/booking/:id)//
  * app.put('booking/:id)// upsert  upadet ==> update (if exitst) or insert(if dosn,t exist)
  * app.delete('booking/:id)
  */

  app.get('/booking', verifyJWT, async (req, res) => {
    const patient = req.query.patient;
    const decodedEmail = req.decoded.email;
  console.log(patient)
           if(decodedEmail===patient){
            const query = { patient: patient };
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings);
           }
  
    else {
      return res.status(403).send({ message: 'forbidden access' });
    }
  });




      app.post('/booking' ,async(req,res)=>{
        const booking=req.body;
       const query ={treatment:booking.treatment,date:booking.date, patient:booking.patient}
       const  exists=await  bookingCollection.findOne(query);
       if(exists){
         return res.send({success:false,booking:exists})
       }
       const result =await bookingCollection.insertOne(booking)
     return   res.send({success:true, result})

      });


} 
finally{

}

}
run().catch(console.dir)


app.get('/', (req, res) => {
  res.send('hello world')
})


app.listen(port, () => {
    console.log(`hello doctor ${port}`)
  })