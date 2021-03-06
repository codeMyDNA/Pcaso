'use strict'

var formidable   = require('formidable');
var mongoose     = require('mongoose');
var util         = require('util');
var extend       = require('mongoose-schema-extend')

var config       = require('../../config/config');

//var BaseSchema   = mongoose.model("BaseSchema");

var FakeSchema = new mongoose.Schema({
    dateAdded:      { type: Number,  default: Date.now },            // Join date
    lastUpdated:    { type: Number,  default: Date.now },            // Last seen
    links: {
	link: { type: String, default: config.service.domain + "404" }, //point to 404 page
	local: { type: String, default: "/404" },
	avatar: { type: String, default: "/404" }
    }
}).extend({});


FakeSchema.method({    
    addComment:    function(id){ return id; },
    deleteComment: function(id){ return id; },
    removeComment: function(id){ return id; },
    deleteFile:    function(id){ return id; },
    addNotification: function( id ){
	
    }
});

FakeSchema.static({
    generateDoc: function(){
	var document = {
	    _id:  mongoose.Types.ObjectId().toString(),
	    __t: 'FakeModel',
	    displaySettings: {
		link: "http://localhost/3000/cool"
	    },
	   
	    // Methods
	    addComment:    function(id){ return id; },
	    deleteComment: function(id){ return id; },
	    removeComment: function(id){ return id; },
	    deleteFile:    function(id){ return id; },
	    addNotification: function( id ){
		
	    }
	}

	return document;
    }
});

FakeSchema.set('versionKey', false);

FakeSchema.pre('save', function( next ){
    var fake = this;
    fake.lastUpdated = Date.now();    
    next();
});

                  
FakeSchema.pre('remove', function( next ){
    next();
});

module.exports = mongoose.model('FakeModel', FakeSchema);
