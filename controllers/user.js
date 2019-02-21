const jwt = require('jsonwebtoken');
const User = require('../models/user');
const multer  = require('multer');
const config  = require('../config/database');
var bcrypt = require("bcrypt-nodejs");
var SALT_FACTOR = require('../config/bcrypt');

storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/uploads/users')
    },
    filename: function (req, file, cb) {
      cb(null,file.originalname)
    }
  })
var upload = multer({ storage:storage }).single('photo');

// TODO : CRUD, filters
module.exports = {
    signup:function(req,res){
        upload(req, res, function (err) {
            if (err instanceof multer.MulterError) {
              return res.status(400).json({
                    success:false,
                    message:`${err.message} ${err.field ? err.field : ''}`
              })
            } else if (err) {
                return res.status(400).json({
                    success:false,
                    message:'An unknown error occurred when uploading.',
                })
            }
            else{
                // Everything went fine.
                let body = {};
                // If file is uploaded
                if(req.file){
                    body = {
                        photo:process.env.DOMAIN+'/'+req.file.path
                    }
                }
                Object.assign(body,req.body);
                let user = new User(body);
                user.save(function(err,doc){
                    if(err){
                        return res.status(422).json({
                            success:false,                            
                            errors:err.code == 11000 && err.name == 'MongoError' ? {username:{message:'Username already exist'}} : err.errors,
                            message:'Invalid data'
                        })
                    }
                    else{
                        return res.json({
                            success:true,
                            message:"You're registered successfully",                            
                            data:doc
                        })
                    }
                })
            }
        })   
    },
    login:function(req,res){
        var username = req.body.username;
        var password = req.body.password;
       
        if(!username){
            return res.status(422).json({
                success:false,
                message:"Invalid data",
                errors:{
                    username:{message:'Username is required!'}
                }
            })
        }

        if(!password){
            return res.status(422).json({
                success:false,
                message:"Invalid data",
                errors:{
                    password:{message:'Password is required!'}
                }
            })
        }

        User.findOne({username:username},function(err,doc){
            if(err || !doc){
                return res.status(404).json({
                    success:false,
                    message:"Invalid data",
                    errors:{
                        username:{message:'Username is not found!'}
                    }
                });
            }   
            doc.checkPassword(password,function(err,isMatch){
                if(!isMatch || err){
                    return res.status(422).json({
                        success:false,
                        message:"Invalid data",
                        errors:{
                            password:{message:'Password is Incorrect!'}
                        },
                        err:err
                    })
                }
                else{
                    var token = jwt.sign({user:doc},config.secret,{
                        expiresIn:"9h"
                    });
                    res.json({
                        success:true,
                        token:'bearer ' + token,
                        user:{
                            id:doc._id,
                            username:doc.username,
                            photo:doc.photo  
                        }
                    })
                }
            })
        });
    },
    all:function(req,res,next){
        authenticateRoutes(req,res,next,function(isAuthenticated){
            if(isAuthenticated){
                User.find({},'-password',function(err,users){
                    if(err){
                        return res.status(400).json({
                            success:false,
                            message:"Error"
                        })
                    }
                    else{
                        return res.status(400).json({
                            success:true,
                            data:users
                        })
                    }
                })
            }
        })
    },
    me:function(req,res,next){
        passport.authenticate('jwt',{ session: false },function(err, user, info){
            if(err) {
                cb(err);
                return handleServerError(err,req,res);
            }
            else if(!user){                
                return res.status(401).json({
                    success:false,
                    message:"Not Authorized!"
                })
                
            }
            else{
                return res.json({
                    success:true,
                    user:user                    
                })
            }
        })(req,res,next)
    },
    updateMyProfile:function(req,res,next){
        passport.authenticate('jwt',{ session: false },function(err, user, info){
            if(err) {
                return handleServerError(err,req,res);
            }
            else if(!user){
                return res.status(401).json({
                    success:false,
                    message:"Not Authorized!"
                })
            }
            else{
                upload(req, res, function (err) {
                    if (err instanceof multer.MulterError) {
                      return res.status(400).json({
                            success:false,
                            message:`${err.message} ${err.field ? err.field : ''}`
                      })
                    } else if (err) {
                        return res.status(400).json({
                            success:false,
                            message:'An unknown error occurred when uploading.',
                        })
                    }
                    else{
                        // Everything went fine.
                        let body = {};
                        // If file is uploaded
                        if(req.file){
                            body = {
                                photo:process.env.DOMAIN+'/'+req.file.path
                            }
                        }
                        if(req.body.username){
                            body.username = req.body.username;
                        }
                        hashPassword(req.body.password,function(hashedPassword){
                            if(hashedPassword){
                                body.password = hashedPassword;
                            }                            
                            User.findByIdAndUpdate(user._id,body,{new:true},function(err,doc){
                                if(err){
                                    return res.status(422).json({
                                        success:false,
                                        message:"Invalid data",
                                        errors:err
                                    })
                                }
                                else{
                                    return res.json({
                                        success:true,
                                        message:"Profile Updated Successfully",
                                        user:{
                                            id:doc._id,
                                            username:doc.username,
                                            photo:doc.photo  
                                        }
                                    }) 
                                }
                            })
                        })                      
                    }
                })
            }
        })(req,res,next)
    }
}

function hashPassword(password,cb){
    if(password){
        bcrypt.genSalt(SALT_FACTOR,function(err,salt){
            if(err) return handleServerError(err,req,res);
            bcrypt.hash(password,salt,noop,function(err,hashedPassword){
                if(err) return handleServerError(err,req,res);
                cb(hashedPassword);
            })
        })
    }
    else{
        cb(null)
    }
}

function authenticateRoutes(req,res,next,cb){
    passport.authenticate('jwt',{ session: false },function(err, user, info){
        if(err) {
            cb(err);
            return handleServerError(err,req,res);
        }
        else if(!user){
            cb(false);
            return res.status(401).json({
                success:false,
                message:"Not Authorized!"
            })
        }
        else{
            cb(true,user);
        }
    })(req,res,next)
}

function handleServerError(err, req, res, next){    
    return res.status(500).json({
        success:false,
        message:"Internal server error."
    });
}

var noop = function(){};