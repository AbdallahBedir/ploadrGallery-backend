var CommentModel = require("../models").Comment,
ImageModel = require("../models").Image;

module.exports = {
    //
    /**
     * TODO: Get the last 5 comments
     * and use async module to attach the image to each comment 
     * @param {*} req 
     * @param {*} res 
     */
    list:function(req,res,next){
        authenticateRoutes(req,res,next,function(isAuthenticated){
            if(isAuthenticated){                
                CommentModel.find(function(err,docs){
                    if(err){
                        return res.status(404).json({
                            success:false,
                            error:err
                        })  
                    }
                    else{
                        return res.json({
                            success:true,
                            data:docs
                        }) 
                    }
                })
            }
        })
    },
    // Latest comments
    latest:function(req,res,next){
        authenticateRoutes(req,res,next,function(isAuthenticated){
            if(isAuthenticated){
                CommentModel.find({},{},{limit:5,sort:{timestamp:-1}})
                .populate('image user',['title','path','username']).exec(function(err,comments){
                    if(err){
                        return res.status(404).json({
                            success:false,                   
                            error:"Comments Not Found!" 
                        })  
                    }
                    else{
                        return res.json({
                            success:true,
                            data:comments
                        }) 
                    }
                })
            }
        })
    },
    edit:function(req,res,next){
        authenticateRoutes(req,res,next,function(isAuthenticated,user){
            if(isAuthenticated){
                CommentModel.findById(req.params.comment_id,function(err,comment){
                    if(err){
                        return res.status(404).json({
                            success:false,
                            message:"Comment not found!"
                        })
                    }
                    else{
                        if(comment.user_id.equals(user.id)){
                            comment.comment = req.body.comment;
                            comment.save(function(err,doc){
                                if(err){
                                    return res.status(400).json({
                                        success:false,
                                        message:"Error while updating the comment"
                                    })
                                }
                                else{
                                    return res.json({
                                        success:true,
                                        message:"Comment updated successfully",
                                        data:comment
                                    })
                                }
                            });
                        }
                        else{
                            return res.status(400).json({
                                success:false,
                                message:'You can only edit your comments'
                            })
                        }
                    }
                })
            }
        })
    },
    delete:function(req,res,next){
        authenticateRoutes(req,res,next,function(isAuthenticated,user){
            if(isAuthenticated){
                CommentModel.findById(req.params.comment_id,function(err,comment){
                    if(err){
                        return res.status(404).json({
                            success:false,
                            message:"Comment not found!"
                        })
                    }
                    else{
                        if(comment.user_id.equals(user.id)){
                            comment.remove(function(err,doc){
                                if(err){
                                    return res.status(400).json({
                                        success:false,
                                        message:"Error while deleting the comment"
                                    })
                                }
                                else{
                                    return res.json({
                                        success:true,
                                        message:"Comment deleted successfully",
                                        data:comment
                                    })
                                }
                            });
                        }
                        else{
                            return res.status(400).json({
                                success:false,
                                message:'You can only delete your comments'
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