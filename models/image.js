var mongoose = require('mongoose'),
Schema = mongoose.Schema,
ObjectId = Schema.Types.ObjectId; 

var ImageSchema = new Schema({
    user_id:{type:ObjectId,required:true,ref:'User'},
    title: {type:String,default:""},
    description: {type:String,default:""},
    filename: {type:String,required:true,unique: true},
    path:{type:String,required:true},
    views:{type:Number,default:0},
    likes:{
        total:{type:Number,default:0},
        users:[{type:ObjectId,required:true,ref: 'User'}]
    },
    timestamp:{type:Date,default:() => new Date()}, //  each time you create a new doc, the default function will be called and a new Date will be returned as the default.
},{
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true 
    }
})

ImageSchema.virtual('comments').set(function(comments){
    this._comments = comments;
}).get(function() {
    return this._comments;
});

ImageSchema.statics.search = function (q,cb){
    return this.find()
    .or([ 
        { title: new RegExp(q,"i") },// (i) Do a case-insensitive search
        { description: new RegExp(q,"i") },
        { filename: new RegExp(q,"i") }
    ])
      .sort({timestamp:-1})
      .exec(cb);
}

module.exports = mongoose.model('Image',ImageSchema);