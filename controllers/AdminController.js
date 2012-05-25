/**
 *  Admin Controller
 **/

var mongoose = require('mongoose'),
	conf = require('node-config'),
	crypto = require('crypto');

// Models
var Settings = mongoose.model('Settings'),
	ActivityItem = mongoose.model('ActivityItem');

exports.controller = function(req, res, next) {
	Controller.call(this, req, res, next);
	var self = this;
	
	self.index = function() {
		if (!req.user.isUser) { return res.redirect('/admin/login'); }
		
		return self.render('admin/index');
	}
	
	self.setup = function() {
		var step;
		var session = req.session;
		
		self._get_settings("app", function (err, app_settings) {
			if (err) throw err;
			
			if (parseInt(req.params.id) > 0) {
				step = parseInt(req.params.id);
			} else
			if (req.params.id === "0" || req.params.id === 0) {
				step = 0;
			} else {
				if (app_settings.value && app_settings.value.setup_step) {
					step = app_settings.value.setup_step;
				} else {
					step = 0;
				}
			}
			
			if (step == 0) {
				if (!app_settings.value || !app_settings.value.user_name || 1==1) {
					if (req.body && req.body.settings && req.body.settings.user_name && req.body.settings.password) {
						var user_name = req.body.settings.user_name;
						var hashed_password = self._hash(req.body.settings.password);
						var session_key = self._generate_session_key(user_name, hashed_password);
						var session_token = self._generate_token(user_name, session_key);
						
						session.session_key = session_key;
						session.session_token = session_token;
						session.user_name = user_name;
						
						app_settings.value.user_name = user_name;
						app_settings.value.password = hashed_password;
						app_settings.value.session_key = session_key;
						self._next_step(app_settings, step);
					} else {
						return self.render('admin/setup/account', {
							locals: {
								title: 'SET USER NAME',
								settings: app_settings.value
							}
						});
					}
				} else {
					self._next_step(app_settings, step);
				}
			} else
			if (step == 1 && req.user.isUser) {
				self._get_settings("twitter", function (err, tw) {
					if (err) throw err;

					if (req.body && req.body.settings && req.body.settings.twitter) {
						// Process form
						if (!tw.value) {
							tw.value = {};
						}
						for (var k in req.body.settings.twitter) {
							tw.value[k] = req.body.settings.twitter[k];
						}
						tw.commit('value');
						tw.save(function (err) {
							if (err) throw err;
							
							// Done with this step. Continue!
							self._next_step(app_settings, step);
						});
						return;
					} else {
						// Show the page for this step
						return self.render('admin/setup/twitter_app', {
							locals: {
								title: 'Express TEST',
								settings: tw.value
							}
						});
					}
				});
			} else
			if (step == 2 && req.user.isUser) {
				self._get_settings("twitter", function (err, tw) {
					if (err) throw err;
					
					var is_setup = false;
					if (tw && tw.value && tw.value.consumer_key && tw.value.consumer_secret) {
						is_setup = true;
					}
					// Show the page for this step
					return self.render('admin/setup/connect', {
						locals: {
							title: 'Connect to Twitter',
							settings: {},
							is_setup: is_setup,
							current_step: step
						}
					});
				});
			} else {
				req.flash("Setup Complete!");
				res.redirect("/admin");
			}
		});
	}
	
	
	self.login = function () {
		var redirect_url = "";
		var session = req.session;
		if (req.body.user_name && req.body.password) {
			redirect_url = "/admin/login";
			self._get_settings("app", function (err, app_settings) {
				if (err) throw err;
				
				if (app_settings && app_settings.value.user_name) {
					var session_key = app_settings.value.session_key;
					var user_name = app_settings.value.user_name;
					var password = app_settings.value.password;
					
					if (req.body.user_name === user_name && self._hash(req.body.password) === password) {
						// Good to go!
						
						redirect_url = "/";
						
						if (!session_key || session_key == "") {
							session_key = self._generate_session_key(user_name, password);
						}
						
						var session_token = self._generate_token(user_name, session_key);
						
						session.session_key = session_key;
						session.session_token = session_token;
						session.user_name = user_name;
					} else {
						console.log("Flashing error message");
						req.flash("Login failed");
					}
				} else {
					console.log("Didn't user details in app settings..");
				}
				
				finish();
			});
		} else {
			finish();
		}
		
		function finish () {
			if (redirect_url == "") {
				console.log("Show login form");
				self.render('admin/login', {
					locals: {
						title: 'Login',
						user_name: req.body.user_name || ""
					}
				});
			} else {
				console.log("Redirect to "+redirect_url);
				res.redirect(redirect_url);
			}
		}
	}
	
	self.logout = function () {
		var redirect_url = "/";
		var session = req.session;
		
		session.destroy();
		res.redirect("/");
	}
	
	
	// PRIVATE METHODS
	
	self._get_settings = function (option, cb) {
		Settings.findOne({option: option}, function(err, s) {
			if (err) return cb(err);
			
			if (!s) {
				s = new Settings({option: option, value: {}});
			}
			cb(null, s);
		});
	}
	
	self._next_step = function (app_settings, step) {
		step++;
		app_settings.value.setup_step = step;
		app_settings.commit('value');
		app_settings.save(function (err) {
			if (err) throw err;
			
			res.redirect('/admin/setup/'+step);
		});
	}
	
	self._generate_session_key = function (u, p) {
		var key = "";
		key = self._hash(u+p+Date.now());
		return key;
	}
	
	self._generate_token = function (u, k) {
		token = self._hash(u+"|"+k);
		return token;
	}
	
	self._hash = function (str) {
		var hashed;
		var h = crypto.createHash('sha1');
		h.update(str);
		hashed = h.digest('hex');
		return hashed;
	}
};