import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken"
import authenticateToken from "./utilities.js";
import User from "./models/user.model.js";
import Note from "./models/note.model.js";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config(); // load .env

// Connect DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

const app = express();


app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://notes-app-7w6j.onrender.com",
    ],
    credentials:true,
    methods: ["GET", "POST", "PUT","DELETE"],
    allowedHeaders: ["Content-Type","Authorization"],
  })
);

// app.get("/", (req, res) => {
//   res.json({ data: "hello" });
// });



//create Account
app.post("/signin", async (req, res) => {
  try {
    const { fullName, email, password } = req.body || {};

    if (!fullName) {
      return res.status(400).json({ error: true, message: "Full Name is required" });
    }
    if (!email) {
      return res.status(400).json({ error: true, message: "Email is required" });
    }
    if (!password) {
      return res.status(400).json({ error: true, message: "Password is required" });
    }

    const isUser = await User.findOne({ email });
    if (isUser) {
      return res.status(400).json({ error: true, message: "User already exists" });
    }

    const newUser = new User({
      fullName,
      email,
      password,
    });
    await newUser.save();

    const accessToken = jwt.sign(
      {
        user: {
          _id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          createdOn: newUser.createdOn,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      error: false,
      user: {
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        createdOn: newUser.createdOn,
      },
      accessToken,
      message: "Registration Successful",
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
});



//login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: true, message: "Email is required" });
    }
    if (!password) {
      return res.status(400).json({ error: true, message: "Password is required" });
    }

    const isUser = await User.findOne({ email });

    if (!isUser) {
      return res.status(400).json({ error: true, message: "No user found" });
    }
    if (isUser.password !== password) {
      return res.status(400).json({ error: true, message: "Invalid Credentials" });
    }

    const accessToken = jwt.sign(
      {
        user: {
          _id: isUser._id,
          fullName: isUser.fullName,
          email: isUser.email,
          createdOn: isUser.createdOn,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      error: false,
      message: "Login Successful",
      user: {
        _id: isUser._id,
        fullName: isUser.fullName,
        email: isUser.email,
        createdOn: isUser.createdOn,
      },
      accessToken,
    });
  } catch (err) {
    console.error("Login error: ", err);
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
});


//getUsers
app.get("/getusers", authenticateToken,async (req,res) => {
  const { user } = req.user;
  const isUser = await User.findOne({_id: user._id});

  if(!isUser){
    return res.sendStatus(401);
  }

  return res.json({user: {fullName: isUser.fullName, email: isUser.email,id:isUser._id,createdOn: isUser.createdOn}});
})


//Add Note
app.post("/addnote",authenticateToken, async (req,res) => {
  const  {title, content,tags} = req.body || {};
  const { user } = req.user;

  if(!title){
    return res.status(400).json({error: true, message: "Title is required"});
  }
  if(!content){
    return res.status(400).json({error: true, message: "Content is required"});
  }

  try{
    const note = new Note({
      title,
      content,
      tags: tags || [],
      userId: user._id,
    });

    await note.save();

    return res.json({
      error: false,
      note,
      message: "Note added successfully",
    });
  }catch(err){
    return res.status(500).json({error: true, message: "Internal Server Error"});
  }
});


//edit note
app.post("/editnote/:noteId",authenticateToken,async (req,res)=>{
  const noteId = req.params.noteId;
  const {title,content,tags,isPinned} = req.body || {};
  const {user} = req.user;

  if(!title && !content && !tags){
    return res.status(400).json({error: true, message:"No chagnes provided"});
  }

  try{
    const note = await Note.findOne({_id: noteId, userId: user._id});
    if(!note){
      return res.status(400).json({error:true ,message:"Note not found"});
    }
    
    if(title) note.title = title;
    if(content) note.content = content;
    if(tags) note.tags= tags;
    if(isPinned) note.isPinned = isPinned;

    await note.save();

    return res.json({
      error:false,
      note,
      message:"Note updated successfully",
    });

  }catch(err){
    return res.status(500).json({error: true, message:"Internal Server Error"});
  }
})


//get all notes
app.get("/getallnotes",authenticateToken, async (req,res)=>{
  const { user } = req.user;

  try{
    const notes = await Note.find({userId: user._id}).sort({isPinned: -1});

    return res.json({
      error: false,
      notes,
      message: "All notes retrieved successfully",
    });

  }catch(err){
    return res.status(500).json({
      error: true,
      message: "Internal Server Error"
    });
  }
})


//delete notes
app.delete("/deletenote/:noteId", authenticateToken, async (req,res)=>{
  const noteId = req.params.noteId;
  const {user} = req.user;

  try{
    const note = await Note.findOne({ _id: noteId, userId: user._id});

    if(!note){
      return res.status(400).json({error:true, message:"Note not found"});
    }
    await Note.deleteOne({_id: noteId, userId: user._id});

    return res.json({
      error: false,
      message: "Note deleted successfully"
    });

  }catch(err){
    return res.status(500).json({error: true, message: "Internal Server Error"});
  }
});


//update isPinned
app.put("/updatenotepinned/:noteId", authenticateToken, async (req,res)=>{
  const noteId = req.params.noteId;
  const { isPinned } = req.body;
  const { user } = req.user;

  try{
    const note = await Note.findOne({_id: noteId, userId: user._id});

    if(!note){
      return res.status(400).json({error:true, message:"Note not found"});
    }

    note.isPinned = isPinned;

    await note.save();

    return res.json({
      error:false,
      note,
      message:isPinned ? "Note Pinned Successfully" : "Note Unpinned Successfully",
    });
  }catch(err){
    return res.status(500).json({error: true, message:"Internal Server Error"});
  }
})


//Search Note
app.get("/searchnote", authenticateToken, async (req,res) => {
  const { user } = req.user;
  const { query } = req.query;

  if(!query){
    return res.status(400).json({error:true, message: 'Search query is required'});
  }

  try {
    const matchNotes = await Note.find({
      userId: user._id,
      $or: [
        {title: {$regex: new RegExp(query, "i")}},
        {content: {$regex: new RegExp(query, "i")}},
      ],
    });

    return res.json({error: false, notes: matchNotes, message: "Notes matching the serach query retrieved successfully"});

  } catch(error){
    return res.status(500).json({error: true, message: "Internal Server Error"});
  }

})


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend build
app.use(express.static(path.join(__dirname, "../Frontend/dist")));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/dist/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
