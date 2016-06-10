
function newHarness() {
  var harness = { };
  harness.joc = jasmine.objectContaining;

  harness.callbackSpy = function(method) {
    method = method || 'callback';
    var wrapper = { };
    wrapper[method] = function() { };
    spyOn(wrapper, method);
    return wrapper;
  };

  harness.mockForm = function() {
    var methods = [ '$setValidity', '$setPristine', '$setDirty' ];
    var form = { };

    _.each(arguments, function(field) {
      form[field] = { };
      _.each(methods, function(method) {
        form[field][method] = jasmine.createSpy(method);
      });
    });

    return form;
  };

  harness.stub = function(obj, name) {
    spyOn(obj, name).and.stub();
  };

  _.each(arguments, function(arg) {
    arg(harness);
  });

  return harness;
}

function withHTTP(harness) {
  if(!harness.$hasHTTP) {
    harness.$hasHTTP = true;

    beforeEach(inject(function($httpBackend) {
      harness.http = $httpBackend;
    }));

    afterEach(function() {
      harness.http.verifyNoOutstandingExpectation();
      harness.http.verifyNoOutstandingRequest();
    });

    harness.withParams = function(url, params) {
      var queryString = _.map(params, function(value, key) { return key + '=' + value }).join('|');
      return new RegExp(url + '\\?((' + queryString  + ')\\&?){' + _.keys(params).length + '}');
    };

    harness.httpIgnore = function() {
      var args = arguments;

      beforeEach(function() {
        _.each(args, function(url) {
          harness.http.whenGET(url).respond({ answer: { entries: [] } });
          harness.http.whenPOST(url).respond({ answer: { entries: [] } });
        });
      });
      afterEach(function() { harness.http.flush(); });
    };
  }
}

function withScope(harness) {
  if(!harness.$hasScope) {
    harness.$hasScope = true;
    beforeEach(inject(function($rootScope) {
      harness.scope = $rootScope.$new();
    }));
  }
}

function withDeferred(harness) {
  if(!harness.$hasDeferred) {
    harness.$hasDeferred = true;
    withScope(harness);

    beforeEach(inject(function($q) {
      harness.q = $q;
      harness.mockDeferred = function(obj, name) {
        var mock = harness.q.defer();
        spyOn(obj, name).and.returnValue(mock.promise);
        mock.resolveMock = function(value) {
          mock.resolve(value);
          harness.scope.$apply();
        };
        mock.rejectMock = function(reason) {
          mock.reject(reason);
          harness.scope.$apply();
        };
        return mock;
      };

      harness.expectResolve = function(promise, value, resolver) {
        var fake = harness.callbackSpy();
        promise.then(fake.callback);
        (resolver || angular.noop)(value);
        harness.scope.$apply();
        expect(fake.callback).toHaveBeenCalledWith(value);
      };
    }));
  }
}

function withState(harness) {
  if(!harness.$hasState) {
    harness.$hasState = true;
    beforeEach(inject(function($state) {
      harness.state = $state;
      spyOn(harness.state, 'go');
      spyOn(harness.state, 'transitionTo');

      harness.expectState = function() {
        var exp = expect(harness.state.go);
        exp.toHaveBeenCalledWith.apply(exp, arguments);
      };

      harness.expectTransition = function() {
        var exp = expect(harness.state.transitionTo);
        exp.toHaveBeenCalledWith.apply(exp, arguments);
      };
    }));
  }
}

function withEmit(harness) {
  if(!harness.$hasEmit) {
    harness.$hasEmit = true;
    withScope(harness);

    beforeEach(function() {
      spyOn(harness.scope, '$emit');
    });

    harness.expectEmit = function() {
      var exp = expect(harness.scope.$emit);
      exp.toHaveBeenCalledWith.apply(exp, arguments);
    };
  }
}

function uncamel(name) {
  return name.replace(/[A-Z]/g, function(letter, pos) {
    return (pos ? '-' : '') + letter.toLowerCase();
  });
}

// Spec types

function describeProvider(name, body, extraModuleDef) {
  var moduleName = 'interview.service.' + uncamel(name);
  describe(moduleName, function() {
    if(extraModuleDef) {
      if(_.isFunction(extraModuleDef)) {
        beforeEach(extraModuleDef);
      } else {
        beforeEach(module(extraModuleDef));
      }
    }

    var providerName = (name + '-provider').replace(/-[a-z]/g, function(chars, _) { return chars.substring(1).toUpperCase(); });
    var harness = newHarness();
    beforeEach(function() {
      var specMod = angular.module(moduleName + '.spec', [ ], function () { });
      specMod.config([ providerName, function(provider) {
        harness.provider = provider;
      }]);
      module(moduleName, moduleName + '.spec');
      inject(function() { });
    });

    body(harness);
  });
}

function describeService(name, body, extraModuleDef) {
  var moduleName = 'interview.service.' + uncamel(name);
  describe(moduleName, function() {
    beforeEach(module(moduleName));
    if(extraModuleDef) {
      if(_.isFunction(extraModuleDef)) {
        beforeEach(extraModuleDef);
      } else {
        beforeEach(module(extraModuleDef));
      }
    }

    var harness = newHarness(withScope, withHTTP, withDeferred, withEmit); //, withState);

    body(harness);
  });
}

function describeFilter(name, body, extraModuleDef) {
  describe('interview.filter.' + uncamel(name), function() {
    var harness = { };
    beforeEach(module('insight.filter.' + uncamel(name)));
    if(extraModuleDef) {
      if(_.isFunction(extraModuleDef)) {
        beforeEach(extraModuleDef);
      } else {
        beforeEach(module(extraModuleDef));
      }
    }

    beforeEach(inject(function($filter) {
      harness.filter = $filter(name);
    }));

    mockServices(harness);
    body(harness);
  });
}

