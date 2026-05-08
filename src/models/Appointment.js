const mongoose=require('mongoose');
const appointmentSchema=new mongoose.Schema({
    appointmentId     :{type:String,trim:true},
    patientId         :{type:String,trim:true},
    doctorId           :{type:String,trim:true},
    appointmentDate   :{type:Date},
    timeSlot           :{type:String},
    status:{type:String},
    reason:{type:String},
    createdAt:{type:Date,default:Date.now},
});
module.exports=mongoose.model('Appointment',appointmentSchema);