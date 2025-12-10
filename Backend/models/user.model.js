import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userSchema = new Schema({
    fullName: { 
        type: String,
        required: true,
        trim: true,
    },
    email:{ 
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: { 
        type: String,
        required: true,
    },
    createdOn: { 
        type: Date, 
        default: Date.now,
    },

});

const User = mongoose.model("User",userSchema);

export default User;