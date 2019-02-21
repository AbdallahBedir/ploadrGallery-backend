var ImageModel = require("../models").Image,
CommentModel = require("../models").Comment,
async  = require('async')

module.exports = {
    stats:function(req,res,next){
        authenticateRoutes(req,res,next,function(isAuthenticated){
            if(isAuthenticated){
                async.parallel({
                    images:function(callback) {
                        ImageModel.count({},callback)
                    },
                    comments:function(callback) {
                       CommentModel.count({},callback)
                    },
                    views:function(callback){
                        ImageModel.aggregate([                    
                            { $group: { _id: null, totalViews: { $sum: '$views' }}},                    
                            { $project: { _id: 0, totalViews: 1 }}
                        ],function(err,result){
                            if(err){
                                callback(err,null);
                            }
                            let views = 0;
                            if(result.length > 0){
                                views = result[0].totalViews;
                            }
                            callback(null,views);
                        })
                    },
                    likes:function(callback){
                        ImageModel.aggregate([                    
                            { $group: { _id: null, totalLikes: { $sum: '$likes' }}},                    
                            { $project: { _id: 0, totalLikes: 1 }}
                        ],function(err,result){
                            if(err){
                                callback(err,null);
                            }
                            let likes = 0;
                            if(result.length > 0){
                                likes = result[0].totalLikes;
                            }
                            callback(null,likes);
                        })
                    }
                },
                    function(err,results){
                        if(err){
                            res.json({
                                success:false,
                                message:"Error while fetching the stats!"
                            })
                        }
                        else{
                            res.json({
                                success:true,
                                data:results
                            })
                        }
                    }
                )
            }
        })
    },
    //Newest list of images 
    newestImages: function(req, res,next) {
        authenticateRoutes(req,res,next,function(isAuthenticated){
            if(isAuthenticated){
                /**
                 * set the sort order to 1 or -1 to specify
                 * an ascending or descending sort respectively
                 */
                ImageModel.find({},{},{limit:5,sort: { timestamp: -1 }},function(err,images){
                    if(err){
                        return res.status(404).json({
                            success:false,
                            error:"Images Not Found!"
                        })  
                    }
                    else{
                        return res.json({
                            success:true,
                            data:images
                        })
                    }
                });
            }
        })
    },
    //Popular images 
    popular: function(req, res,next) {
        authenticateRoutes(req,res,next,function(isAuthenticated){
            if(isAuthenticated){
                /**
                 * set the sort order to 1 or -1 to specify
                 * an ascending or descending sort respectively
                 */
                ImageModel.find({},{},{limit:5,sort: { "likes.total": -1,views: -1 }},function(err,images){
                    if(err){
                        return res.status(404).json({
                            success:false,
                            error:"Images Not Found!"
                        })  
                    }
                    else{
                        res.json({
                            success:true,
                            data:images
                        })
                    }
                });   
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