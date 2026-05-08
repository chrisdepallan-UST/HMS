const mongoose=require('mongoose');
const appointmentSchema=new mongoose.Schema({
    appointmentId     :{type:String,trim:true},
    patientId         :{type:String,trim:true},
    doctorId           :{type:String,trim:true},
    appointmentDate   :{type:Date},
    timeSlotFrom           :{type:Date},
    timeSlotTo           :{type:Date},
    status:{type:String},
    reason:{type:String},
    createdAt:{type:Date,default:Date.now},
});
module.exports=mongoose.model('Appointment',appointmentSchema);