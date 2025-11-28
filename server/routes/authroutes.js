const express = require('express');
const router = express.Router();
const pool = require('../config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authmiddleware = require('../middleware/authmiddleware');
router.post('/register', async (req, res) => {
  try {
    const { username,password, email } = req.body;
    if (!username || !password || !email) {
      return res.json({ success: false, message: "Parameters are missing" });
    }
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.json({ success: false, message: "User already exists, please login" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [username, email, hashedPassword]
    );
    const userId = result.rows[0].id;
    const token = jwt.sign({ userId }, process.env.jwt_secret, { expiresIn: "1h" });
    res.json({ message: "Successfully registered", success: true, token ,result});
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
});
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({ success: false, message: "Parameters not provided" });
    }
    const user = await pool.query('SELECT id, password_hash FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.json({ success: false, message: "User does not exist" });
    }
    const isMatching = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isMatching) {
      return res.json({ success: false, message: "Wrong password" });
    }
    const token = jwt.sign({ userId: user.rows[0].id }, process.env.jwt_secret, { expiresIn: "1h" });
    res.json({ message: "Logged in", success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
});
router.get('/get-current-user',authmiddleware,async(req,res)=>{
  try {
    const id = req.userId;
    const user = await pool.query('SELECT * FROM users WHERE id = $1',[id]);
    if(user.rows.length===0){
      return res.json({message:"User dosen't exist",success:false})
    }
    let result = {id:user.rows[0].id,username:user.rows[0].username,email:user.rows[0].email}
    res.json({success:true,message:"User found successfully",user:result});
  } catch (error) {
    console.log(error)
  }
});
module.exports = router;
