'user strict'

var formidable   = require('formidable');
var mongoose     = require('mongoose');
var grid         = require('gridfs-stream');
var fs           = require('fs');
var util         = require('util');
var multipart    = require('multipart');
var config       = require('../../config/config');

var BaseSchema     = require('./base-schema');

var FileContainerSchema = new mongoose.Schema({
    
    dateAdded:       { type: Number,  default: Date.now },     // Join date
    lastUpdated:     { type: Number,  default: Date.now },     // Last seen
    parent: {
        collection:      { type: String,  required: true },     // collection
        id:              { type: String,  required: true }      // id
    },
    file: {
     	name:            { type: String,  required: true },              // Path to file
	path:            { type: String,  required: true },              // Path to file
     	id:              { type: Object, 'default': mongoose.Types.ObjectId().toString() } 
    },    
    visibility:      { type: String, 'default': 'PRIVATE' },  // Visibility
    sharedWith:      { type: [],     'default': [] },         // List of entities who can access the file
    comments:        { type: [],     'default': [] },
    statistics:      { type: Object, 'default': {} },
    metaData: {
	veiws:            { type: Number, 'default': 0 }      // File metadata
    },
    displaySettings:  { type: Object, 'default': {} },         // Display settings.
    bulletLink:       { type: String },
    settings: {
        acceptFiles:      { type: Boolean, 'default': false },
        commentable:      { type: Boolean, 'default': true }
    }
});


FileContainerSchema.method({
    // Adds new comment ID to list of comments IFF commenting is enabled
    addComment: function(commentID){
        if( !this.commentable )
            return new Error( 'Commenting is not allowed on this object' );
        return this.comments.push( commentID );
    },
    
    deleteComment: function( commentID ){
	var index = this.comments.indexOf( commentID );     
        return ( index >= 0 ) ? this.comments.splice( index, 1) : [] ;
    },
    
    removeComment: function(commentID){	
	var deleted = this.deleteComment( commentID );
        if( deleted.length && this._id !== commentID ){
            Comments.findOne({ _id: commentID }, function(err, doc){
		console.log('Found the comment');
		doc.remove();
	    });   
	}

	return deleted;
    },
    
    addSharedUser: function( newSharedUserID ){
        this.sharedWithIDs.push( newSharedUserID );
	// email user
    },

    deleteSharedUser: function( sharedUserID ){
	var index = this.sharedWithIDs.indexOf( sharedUserID );
	return ( index >= 0 ) ? this.sharedWith.splice( index, 1) : [] ;
    },
    
    updateSettings: function( newSettings ){
	// Maybe want to keep history 
        // array of objects perhaps?
        return this.settings = newSettings; 
    },
    
    getFile: function(){
	// update view count	
    },

    viewableTo: function( entity ){ 
        var fileContainer = this;
        
        // Is file public 
	if( fileContainer.visiblity === 'PUBLIC') return true;
        
        // Does entity exist and is it an entity
        if( !entity || !entity._id ) return false ;
        
	// Entity is owner 
        // Stringify and compaire because we don't know if `entity._id` will be ObjectID or String	
	if( String( fileContainer.parent.id ) === String( entity._id ) ) return true;

        // File is private and entity is on the shared list
        console.log('Am I a shared user?', fileContainer.sharedWith.indexOf( entity._id ) );
        return fileContainer.visibility === 'PRIVATE' &&
            ( fileContainer.sharedWith.indexOf( entity._id ) !== -1 ) ;
        
        // TODO: Error checking for not public or private 
    }
    
});

//FileContainerSchema.pre('init', function(next){
  //  console.log)

// Update dates 
FileContainerSchema.pre('save', function(next){
    // TODO error checking

    var fileContainer = this;
    fileContainer.lastUpdated = Date.now();
    
    if( fileContainer.isNew ){
	
	grid.mongo = mongoose.mongo;
	var conn   = mongoose.createConnection(config.db);
	var documentId = mongoose.Types.ObjectId();        		

        conn.once('open', function(){
	    
	    var gfs = grid(conn.db);
	    
	    var writestream = gfs.createWriteStream({
		_id: fileContainer.file.id,
		parent: {
		    id: fileContainer._id,
		    collection: fileContainer.__t
		},
 		filename: fileContainer.file.name,
		create: Date.now,
		root: 'uploads',
	 	mode: 'w'		    
	    });
	    
	    fs.createReadStream(fileContainer.file.path).pipe(writestream);
	    
	    // May want to keep some files around
	    if( !fileContainer.keepFile ) fs.unlinkSync(fileContainer.file.path);	    
	});
    }
    
    next();
});

// Before a user deletes their account, remove all of their files and directory

FileContainerSchema.pre('remove', function(next) {
    var fileContainer = this;
    
    grid.mongo = mongoose.mongo;
    var conn   = mongoose.createConnection(config.db);
    var fileQuery = {_id: this.fileId, root: 'uploads'};
    
    // Delete file
    conn.once('open', function () {
	grid(conn.db).remove( fileQuery, function (err) {
	    if (err) return handleError(err);
	    // console.log('File removed', options._id);
	});	
    });
    
    // pop pop pop
    while( fileContainer.comments.length !== 0 ){
	// console.log('Deleting file', fileContainer.comments[0]);
	fileContainer.removeComment( user.fileIDs[0] );
    };     
    
    next();
});

module.exports = mongoose.model('FileContainer', FileContainerSchema);
