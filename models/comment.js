var mongoose = require("mongoose"),
Schema = mongoose.Schema,
ObjectId = Schema.Types.ObjectId; 

var CommentSchema = new Schema({
    image_id :{type:ObjectId,required:true,ref: 'Image'},
    user_id:{type:ObjectId,required:true,ref:'User'},
    comment:{type:String,required:true},
    timestamp:{type:Date,default:Date.now}
},{
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true 
    }
});

CommentSchema.virtual('image',{
    ref:'Image',
    localField: 'image_id', // Find the image where `localField`
    foreignField: '_id', // is equal to `foreignField`
    justOne: true,
}).set(function(image){
    this._image = image;
}).get(function() {
    return this._image;
});

CommentSchema.virtual('user',{
    ref:'User',
    localField: 'user_id', // Find the image where `localField`
    foreignField: '_id', // is equal to `foreignField`
    justOne: true,
}).set(function(user){
    this._user = user;
}).get(function() {
    return this._user;
});

module.exports = mongoose.model('Comment',CommentSchema)