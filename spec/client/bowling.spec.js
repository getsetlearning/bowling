
describeService('bowling', function(t) { with(t) {

  var game;
  beforeEach(inject(function(bowling) {
    game = bowling();
  }));

  function rollMany(game, rolls, pins) {
    _.times(rolls, _.partial(game.roll, pins));
  }

  function rollSpare(game) {
    game.roll(5);
    game.roll(5);
  }

  function rollStrike(game) {
    game.roll(10);
  }

  it('starts the score at zero', function() {
    expect(game.score()).toEqual(0);
  });

  it('should handle all gutter balls', function() {
    rollMany(game, 20, 0);
    expect(game.score()).toEqual(0);
  });

  it('should handle all ones', function() {
    rollMany(game, 20, 1);
    expect(game.score()).toEqual(20);
  });

  it('should score a single spare correctly', function() {
    rollSpare(game);
    game.roll(3);
    expect(game.score()).toEqual(13);
  });

  it('should score a single strike correctly', function() {
    rollStrike(game);
    game.roll(3);
    game.roll(4);
    expect(game.score()).toEqual(24);
  });

  it('should score multiple strikes in a row correctly', function() {
    rollStrike(game);
    rollStrike(game);
    rollStrike(game);
    expect(game.score()).toEqual(30);
    game.roll(3);
    expect(game.score()).toEqual(53);
    game.roll(4);
    expect(game.score()).toEqual(77);
  });

  it('should score a perfect game', function() {
    rollMany(game, 12, 10);
    expect(game.score()).toEqual(300);
  });
}});

