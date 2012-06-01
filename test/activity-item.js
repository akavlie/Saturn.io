var assert = require('assert')
  , analyze_me = require('../models/ActivityItem').analyze_me
  , mongoose = require('mongoose');

suite('Natural Language', function() {
  setup(function() {
    mongoose.connect('mongodb://localhost/testdb');
  });

  suite('natural', function() {
  });
});


suite('Array', function(){
  setup(function(){
    // ...
  });

  suite('#indexOf()', function(){
    test('should return -1 when not present', function(){
      assert.equal(-1, [1,2,3].indexOf(4));
    });
  });
});