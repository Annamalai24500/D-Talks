const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config();
module.exports = function(req,res,next){
    try {
        const header = req.headers.authorization;
        if(!header || !header.startsWith("Bearer ")){
            return res.json({success:false,message:"Header or token provided in wrong format without bearer"});
        }
        const token = header.split(" ")[1].trim();
        const decoded = jwt.verify(token,process.env.jwt_secret);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.log(error);
    }
}