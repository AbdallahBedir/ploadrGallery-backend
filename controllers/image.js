var fs = require('fs'),
path = require('path'),
Image = require("../models").Image,
Comment = require("../models").Comment,
multer  = require('multer'),
storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/uploads/images')
    },
    filename: function (req, file, cb) {
      cb(null,file.originalname)
    }
  })
var upload = multer({ storage:storage }).single('avatar');

module.exports = {
    list:function(req,res,next){
        authenticateRoutes(req,res,next,function(isAuthenticated,user){
            if(isAuthenticated){
                let query = req.query;
                let limit = 10,
                page = Math.abs(query['page']) && Number.isInteger(Math.abs(query['page'])) ? Math.abs(query['page']) : 1,                
                images = Image.find()
            
                switch(query["owner"]) {
                    case 'mine':
                        images = Image.find({user_id:user._id});
                        break;
                    case 'others':
                        images = Image.find({user_id:{$ne:user._id}});
                         break;
                    default:        
                        images = Image.find();
                }
                return images
                .skip(limit * (page-1))
                .or([ 
                    { title: new RegExp(query["q"],"i") },// (i) Do a case-insensitive search
                    { description: new RegExp(query["q"],"i") },
                    { filename: new RegExp(query["q"],"i") }
                ]).limit(limit)                                      
                  .sort({timestamp:-1})
                  .exec(function(err,docs){
                        if(err){
                            return res.json({
                                    success:false,
                                    error:err
                                })
                            }
                            else{
                                Image.count().exec(function(err,total){
                                    return res.status(200).json({
                                        success:true,
                                        data:docs,
                                        paginator:{
                                            totalCount:total,
                                            totalPages:Math.ceil(total/limit),
                                            currentPage:Math.floor(page),
                                            limit:limit
                                        }
                                    })
                                })
                            } 
                    }); 
            }
        })
    },
    index: function(req, res, next) {
        authenticateRoutes(req,res,next,function(isAuthenticated){
            if(isAuthenticated){
                Image.findOne({_id:req.params.image_id}
                    ,function(err,image){
                        if(err){
                            return res.status(404).json({
                                success:false,
                                error:err
                            })
                        }
                        if(image){
                            image.views = image.views + 1;
                            // save the model (since it has been updated):
                            image.save();
                            Comment.find({image_id:image._id},{},{sort:{timestamp:1}})
                                   .populate('user',['username','photo'])                                   
                                   .exec(function(err,comments){
                                if(err){
                                    return res.status(406).json({
                                        success:false,
                                        message:"Failed to get the image comments!"
                                    })
                                }
                                else{
                                    // set comments virtual property
                                    image.comments = comments;
                                    return res.json({
                                        success:true,
                                        data:image
                                    })
                                }
                            })
                        }
                        else{
                            return res.status(404).json({
                                success:false,
                                message:"Image not found"
                            })
                        }
                })
            }
        })
    },
    create: function(req, res, next) {
        authenticateRoutes(req,res,next,function(isAuthenticated,user){
            if(isAuthenticated){
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
                                filename:req.file.originalname,
                                path:process.env.DOMAIN+'/'+req.file.path,
                                user_id:user._id,
                            }
                            Object.assign(body,req.body);
                            var image = new Image(body);
                            image.save(function(err,doc){
                                if(err){
                                    return res.status(406).json({
                                        success:false,                            
                                        errors:err.code == 11000 && err.name == 'MongoError' ? {avatar:'Filename already exist'} : err
                                    })
                                }
                                else{
                                    return res.json({
                                        success:true,
                                        message:"Image uploaded successfully",                            
                                        data:doc
                                    })
                                }
                            })
                        }
                        else{
                            return res.status(422).json({
                                success:false,                            
                                errors:{avatar:"Image avatar is required"}
                            })
                        }
                    }
                })
            }
        })        
    },
    edit:function(req,res,next){
        // TODO: ONLY IMAGE OWNER CAN UPDATE THE IMAGE
        authenticateRoutes(req,res,next,function(isAuthenticated,user){
            if(isAuthenticated){
                Image.findOne({_id:req.params.image_id},function(err,image){
                    if(err){
                        return res.status(404).json({
                            success:false,
                            message:'Image not found.'
                        })
                    }
                    else{
                        //check image ownership
                        if(image.user_id.equals(user._id)){                            
                            Image.findByIdAndUpdate(image._id,req.body,{new:true},function(err,newDoc){
                                if(err){
                                    return res.status(400).json({
                                        success:false,
                                        message:'Error while updating the image.'
                                    })
                                }
                                else{
                                    return res.json({
                                        success:true,
                                        message:"Image updated successfully",
                                        data:newDoc
                                    })
                                }
                            })
                        }
                        else{                            
                            return res.status(400).json({
                                success:false,
                                message:'You can only update your images'
                            }) 
                        }
                    } 
                })
            }
        })
    },
    like: function(req, res,next) {
        authenticateRoutes(req,res,next,function(isAuthenticated,user){
            if(isAuthenticated){
                Image.findOne({_id:req.params.image_id},function(err,image){
                    if(err){
                        return res.status(404).json({
                            success:false,
                            message:'Image not found'
                        })
                    }
                    else{
                        // If the user already liked the image
                        if(image.likes.users && image.likes.users.indexOf(user._id) != -1){
                            return res.status(400).json({
                                success:false,
                                message:'You already liked this image.'
                            })
                        }
                        else{
                            if(!image.likes.users){                                
                                image.likes = {
                                    total:0,
                                    users:[]
                                }                                
                            }
                            image.likes.total = image.likes.total + 1 ;
                            image.likes.users.push(user._id);
                            
                            image.save(err,function(err){
                                if(err){
                                    return res.status(400).json({
                                        success:false,
                                        message:'Error while saving the image.',
                                        err:err
                                    })
                                }
                                else{
                                    return res.json({
                                        success:true,
                                        likes:image.likes
                                    });
                                }
                            });
                        }
                    }
                })
            }
        });
    },
    comment: function(req, res,next) {
        authenticateRoutes(req,res,next,function(isAuthenticated,user){
            if(isAuthenticated){
                // fields are name,email,comment
                Image.findOne({_id:req.params.image_id},function(err,doc){
                    if(err){
                        return res.status(404).json({
                            success:false,
                            message:'Image not found'
                        })
                    }
                    else{
                        let comment = new Comment(req.body);
                        comment.image_id = doc._id;
                        comment.user_id = user._id;
                        comment.save(function(error,comment){
                            if(error){
                                return res.status(422).json({
                                    success:false,
                                    errors:error.errors
                                })
                            }
                            else{
                                comment = comment.toObject();
                                comment.user = user;
                                return res.status(200).json({
                                    success:true,
                                    data:comment
                                })
                            }
                        })
                    }
                })
            }
        })
    },
    remove:function(req,res,next){
        // TODO: ONLY IMAGE OWNER CAN UPDATE THE IMAGE
        authenticateRoutes(req,res,next,function(isAuthenticated,user){
            if(isAuthenticated){
                /**
                 * TODO: remove the image from the datatabse
                 * remove the file
                 * remove related 
                 * we could have used the async's series method here to prevent the
                 *  crazy amount of nesting
                 */
                Image.findById(req.params.image_id,function(err,image){
                    // Delete image file
                    if(err || !image){
                        return res.status(400).json({
                            success:false,
                            message:"Image not found"
                        }) 
                    }
                    else{
                        //check image ownership
                        if(image.user_id.equals(user._id)){ 
                            fs.unlink(path.resolve('./public/uploads/images/'+ image.filename),function(err){
                                if(err){
                                    return res.status(400).json({
                                        success:false,
                                        message:"Cannot remove this image"
                                    })
                                }
                                else{
                                    // Delete image comments
                                    Comment.remove({image_id:image._id},function(err){
                                        // Delete image itself
                                        image.remove(function(err){
                                            if(err){
                                                return res.json({
                                                    success:false,
                                                    message:"Error while deleting the image"
                                                })
                                            }
                                            else{
                                                return res.json({
                                                    success:true,
                                                    message:"Image deleted successfully"
                                                })
                                            }
                                        })
                                    })
                                }
                            })
                        }
                        else{
                            return res.status(400).json({
                                success:false,
                                message:'You can only delete your images'
                            }) 
                        }
                    }
                })
            }
        })
    }    
};

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
            user = user.toObject();
            delete user.password;
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
