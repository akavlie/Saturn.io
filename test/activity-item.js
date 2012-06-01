// suite('Array', function(){
//   setup(function(){
//     // ...
//   });

//   suite('#indexOf()', function(){
//     test('should return -1 when not present', function(){
//       assert.equal(-1, [1,2,3].indexOf(4));
//     });
//   });
// });

describe('Array', function(){
  before(function(){
    // ...
  });

  describe('#indexOf()', function(){
    it('should return -1 when not present', function(){
      [1,2,3].indexOf(4).should.equal(-1);
    });
  });
});