const express = require('express')
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app =express();
const port =process.env.PROT || 5000


  app.use(cors());
   app.use(express.json());




const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6lyyw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
try{
  await client.connect() ;
  const serviceCollection =client.db('doctor_portal').collection('services')
  const bookingCollection =client.db('doctor_portal').collection('bookings')


     app.get('/service', async(req , res)=>{
         const query ={}
         const cursor =serviceCollection.find(query)
        const services = await cursor.toArray()
        res.send(services)
     });
// this is not the proper way to query 
   app.get('/available',async(req,res)=>{
     const date= req.query.date ;
 
     // step1: get aall services
     const services = await serviceCollection.find().toArray( )
      // step 2: get the booking of that day out[{},{},{} {} {}]
      const query ={date: date};
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
  * app.delete('booking/:id)
  */
  app.get('/booking', async(req, res) =>{
    const patient = req.query.patient;
    const query = {patient: patient};
    console.log(query)
    const bookings = await bookingCollection.find(query).toArray();
    res.send(bookings);
  })



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