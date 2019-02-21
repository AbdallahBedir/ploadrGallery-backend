var express = require('express'),
    router = express.Router(),
    home = require('../controllers/home'),
    image = require('../controllers/image'),
    comment = require('../controllers/comment'),    
    user = require('../controllers/user')

module.exports = function(app) {
    router.post("/api/auth/signup",user.signup);
    router.post("/api/auth/login",user.login);
    router.get("/api/users",user.all);
    router.get("/api/users/me",user.me);
    router.put("/api/users/me",user.updateMyProfile);    
    router.get("/api/stats",home.stats);
    router.get('/api/images/newest', home.newestImages);    
    router.get("/api/images/popular",home.popular);
    router.get('/api/images', image.list);
    router.get('/api/images/:image_id', image.index);
    router.delete('/api/images/:image_id', image.remove);
    router.post('/api/images', image.create);
    router.post('/api/images/:image_id/like', image.like);
    router.post('/api/images/:image_id/comment', image.comment);
    router.put('/api/images/:image_id/edit', image.edit);
    router.get('/api/comments', comment.list);
    router.get('/api/comments/latest', comment.latest);
    router.put('/api/comments/:comment_id/edit', comment.edit);
    router.delete('/api/comments/:comment_id/delete', comment.delete);

    router.get("*",function(req,res){
        res.status(404).json({
            success:false,
            message:"Not matching routes"
        })
    })

    app.use(router);
};