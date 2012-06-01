// Analysis Controller
//
// Core natural language processing controller

var sys = require('sys'),
	http = require('http'),
	mongoose = require('mongoose'),
	natural = require('natural'),
	conf = require('node-config');
	
var	TwitterUser = mongoose.model('TwitterUser'),
	ActivityItem = mongoose.model('ActivityItem'),
	Identity = mongoose.model('Identity'),
	Characteristic = mongoose.model('Characteristic'),
	Topic = mongoose.model('Topic'),
	User = mongoose.model('User');

var tokenizer = new natural.TreebankWordTokenizer();
natural.LancasterStemmer.attach();
var wordnet = new natural.WordNet('./cache');

var util = require('util'),
	twitter_api = require('twitter');


exports.controller = function (req, res) {
	Controller.call(this, req, res);
	var self = this;
	
	// run via cron, please
	self.analyze = function () {
		
		ActivityItem.find({analyzed_at: {"$lt": (new Date(Date.now()-86300*1000))}, created_at: {"$gt": (new Date(Date.now()-86400*1000))}})
		.sort('posted_at', -1)
		.limit(30)
		.run(function (err, items) {
			if (err || !items) {
				console.log("No items found "+err);
				res.send("Done");
				return;
			}
			
			analyze_next();
			function analyze_next() {
				if (items.length == 0) {
					return finished();;
				}
				var item = items.shift();
				console.log("Analyzing item: "+item.message);
				//item.ratings = ratings;
				item.analyzed_at = new Date();
				item.save(function (err) {
					item.analyze(function (err, _item) {
						//console.log("Done analyzing "+_item.topics.length);
						//item.commit("ratings");
						_item.save(function (err) {
							// err?
						});
						analyze_next();
					});
				});
			}
			function finished () {
				res.send("Done");
			}
		});
	}
	// end /analysis/analyze
	
}

if (!String.prototype.remove_urls) {
	String.prototype.remove_urls = function () {
		var url_pattern = /\(?\bhttps?:\/\/[-A-Za-z0-9+&@#\/%?=~_()|!:,.;]*[-A-Za-z0-9+&@#\/%=~_()|]/gi;
		return this.replace(url_pattern, "");
	}
}
if (!String.prototype.remove_hashtags) {
	String.prototype.remove_hashtags = function () {
		var hash_pattern = /(^|\s)#[-A-Za-z0-9_]+(\s|$)/gi;
		return this.replace(hash_pattern, "$1$2");
	}
}
if (!String.prototype.remove_screen_names) {
	String.prototype.remove_screen_names = function () {
		var at_pattern = /(^|\s)@[-A-Za-z0-9_]+(\s|$)/gi;
		return this.replace(at_pattern, "$1$2");
	}
}
if (!String.prototype.replace_punctuation) {
	String.prototype.replace_punctuation = function () {
		var alpha_pattern = /[^a-z^A-Z^0-9^-^_]/gi;
		return this.replace(alpha_pattern, " ");
	}
}

