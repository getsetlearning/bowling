angular.module('interview.service.bowling', [ ]).

factory('bowling', [
  function() {
    return function service() {
      var game = { };
      var currRoll = 0;
      var rolls = [];

      game.roll = function(pins) {
        rolls[currRoll++] = pins;
      };

      game.score = function() {
        var score = 0;
        var curr = 0;
        for(var frame = 0; frame < 10 && curr < rolls.length; frame++) {
          if(rolls[curr] == 10) {
            score += 10 + rolls[curr + 1] + rolls[curr + 2];
            curr += 1;
          } else if((rolls[curr] + rolls[curr + 1]) == 10) {
            score += 10 + rolls[curr + 2];
            curr += 2;
          } else if(rolls[curr + 1]) {
            score += rolls[curr] + rolls[curr + 1];
            curr += 2;
          }
        }

        return score;
      };

      return game;
    };
  }
]);

