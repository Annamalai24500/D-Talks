const express = require('express')
const { nanoid } = require('nanoid')
const router = express.Router();
const pool = require('../config')
const authmiddleware = require('../middleware/authmiddleware')
// there should be something in the body right?? in post request
//roomid 5dwkR9mL (use it buddy)
router.post('/createroom/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const roomid = nanoid(8);
        const result = await pool.query('INSERT INTO rooms(room_code,created_by) VALUES($1,$2) RETURNING room_code', [roomid, id]);
        res.json({
            message: "Successfully done",
            roomid,
            room_code: result.rows[0].room_code,
            success: true
        })
    } catch (error) {
        console.log(error)
    }
});
router.get('/allrooms', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM rooms');
        res.json({
            message: "fetched successfully",
            result: result,
            success: true
        });
    } catch (error) {
        console.log(error)
    }
});
router.get('/validroom/:roomId',async (req,res)=>{
    try {
        const roomId = req.params.roomId;
        const result = await pool.query('SELECT * FROM rooms where room_code = $1',[roomId]);
        if(result.rows.length === 0 ){
            return res.json({message:"Unsuccessfull becaue room dosent exist",success:false})
        }else{
            return res.json({message:"Room does exist", success:true})
        }
    } catch (error) {
        console.log(error);
    }
})
module.exports = router