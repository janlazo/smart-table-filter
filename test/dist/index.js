var test = (function () {
'use strict';

/**
 * slice() reference.
 */

var slice = Array.prototype.slice;

/**
 * Expose `co`.
 */

var index$1 = co['default'] = co.co = co;

/**
 * Wrap the given generator `fn` into a
 * function that returns a promise.
 * This is a separate function so that
 * every `co()` call doesn't create a new,
 * unnecessary closure.
 *
 * @param {GeneratorFunction} fn
 * @return {Function}
 * @api public
 */

co.wrap = function (fn) {
  createPromise.__generatorFunction__ = fn;
  return createPromise;
  function createPromise() {
    return co.call(this, fn.apply(this, arguments));
  }
};

/**
 * Execute the generator function or a generator
 * and return a promise.
 *
 * @param {Function} fn
 * @return {Promise}
 * @api public
 */

function co(gen) {
  var ctx = this;
  var args = slice.call(arguments, 1);

  // we wrap everything in a promise to avoid promise chaining,
  // which leads to memory leak errors.
  // see https://github.com/tj/co/issues/180
  return new Promise(function(resolve, reject) {
    if (typeof gen === 'function') gen = gen.apply(ctx, args);
    if (!gen || typeof gen.next !== 'function') return resolve(gen);

    onFulfilled();

    /**
     * @param {Mixed} res
     * @return {Promise}
     * @api private
     */

    function onFulfilled(res) {
      var ret;
      try {
        ret = gen.next(res);
      } catch (e) {
        return reject(e);
      }
      next(ret);
    }

    /**
     * @param {Error} err
     * @return {Promise}
     * @api private
     */

    function onRejected(err) {
      var ret;
      try {
        ret = gen.throw(err);
      } catch (e) {
        return reject(e);
      }
      next(ret);
    }

    /**
     * Get the next value in the generator,
     * return a promise.
     *
     * @param {Object} ret
     * @return {Promise}
     * @api private
     */

    function next(ret) {
      if (ret.done) return resolve(ret.value);
      var value = toPromise.call(ctx, ret.value);
      if (value && isPromise(value)) return value.then(onFulfilled, onRejected);
      return onRejected(new TypeError('You may only yield a function, promise, generator, array, or object, '
        + 'but the following object was passed: "' + String(ret.value) + '"'));
    }
  });
}

/**
 * Convert a `yield`ed value into a promise.
 *
 * @param {Mixed} obj
 * @return {Promise}
 * @api private
 */

function toPromise(obj) {
  if (!obj) return obj;
  if (isPromise(obj)) return obj;
  if (isGeneratorFunction(obj) || isGenerator(obj)) return co.call(this, obj);
  if ('function' == typeof obj) return thunkToPromise.call(this, obj);
  if (Array.isArray(obj)) return arrayToPromise.call(this, obj);
  if (isObject(obj)) return objectToPromise.call(this, obj);
  return obj;
}

/**
 * Convert a thunk to a promise.
 *
 * @param {Function}
 * @return {Promise}
 * @api private
 */

function thunkToPromise(fn) {
  var ctx = this;
  return new Promise(function (resolve, reject) {
    fn.call(ctx, function (err, res) {
      if (err) return reject(err);
      if (arguments.length > 2) res = slice.call(arguments, 1);
      resolve(res);
    });
  });
}

/**
 * Convert an array of "yieldables" to a promise.
 * Uses `Promise.all()` internally.
 *
 * @param {Array} obj
 * @return {Promise}
 * @api private
 */

function arrayToPromise(obj) {
  return Promise.all(obj.map(toPromise, this));
}

/**
 * Convert an object of "yieldables" to a promise.
 * Uses `Promise.all()` internally.
 *
 * @param {Object} obj
 * @return {Promise}
 * @api private
 */

function objectToPromise(obj){
  var results = new obj.constructor();
  var keys = Object.keys(obj);
  var promises = [];
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var promise = toPromise.call(this, obj[key]);
    if (promise && isPromise(promise)) defer(promise, key);
    else results[key] = obj[key];
  }
  return Promise.all(promises).then(function () {
    return results;
  });

  function defer(promise, key) {
    // predefine the key in the result
    results[key] = undefined;
    promises.push(promise.then(function (res) {
      results[key] = res;
    }));
  }
}

/**
 * Check if `obj` is a promise.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isPromise(obj) {
  return 'function' == typeof obj.then;
}

/**
 * Check if `obj` is a generator.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */

function isGenerator(obj) {
  return 'function' == typeof obj.next && 'function' == typeof obj.throw;
}

/**
 * Check if `obj` is a generator function.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */
function isGeneratorFunction(obj) {
  var constructor = obj.constructor;
  if (!constructor) return false;
  if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
  return isGenerator(constructor.prototype);
}

/**
 * Check for plain object.
 *
 * @param {Mixed} val
 * @return {Boolean}
 * @api private
 */

function isObject(val) {
  return Object == val.constructor;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var keys = createCommonjsModule(function (module, exports) {
exports = module.exports = typeof Object.keys === 'function'
  ? Object.keys : shim;

exports.shim = shim;
function shim (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
}
});

var is_arguments = createCommonjsModule(function (module, exports) {
var supportsArgumentsClass = (function(){
  return Object.prototype.toString.call(arguments)
})() == '[object Arguments]';

exports = module.exports = supportsArgumentsClass ? supported : unsupported;

exports.supported = supported;
function supported(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

exports.unsupported = unsupported;
function unsupported(object){
  return object &&
    typeof object == 'object' &&
    typeof object.length == 'number' &&
    Object.prototype.hasOwnProperty.call(object, 'callee') &&
    !Object.prototype.propertyIsEnumerable.call(object, 'callee') ||
    false;
}
});

var index$1$1 = createCommonjsModule(function (module) {
var pSlice = Array.prototype.slice;
var objectKeys = keys;
var isArguments = is_arguments;

var deepEqual = module.exports = function (actual, expected, opts) {
  if (!opts) opts = {};
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!actual || !expected || typeof actual != 'object' && typeof expected != 'object') {
    return opts.strict ? actual === expected : actual == expected;

  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected, opts);
  }
};

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isBuffer (x) {
  if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;
  if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
    return false;
  }
  if (x.length > 0 && typeof x[0] !== 'number') return false;
  return true;
}

function objEquiv(a, b, opts) {
  var i, key;
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return deepEqual(a, b, opts);
  }
  if (isBuffer(a)) {
    if (!isBuffer(b)) {
      return false;
    }
    if (a.length !== b.length) return false;
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b);
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key], opts)) return false;
  }
  return typeof a === typeof b;
}
});

const assertions = {
  ok(val, message = 'should be truthy') {
    const assertionResult = {
      pass: Boolean(val),
      expected: 'truthy',
      actual: val,
      operator: 'ok',
      message
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  deepEqual(actual, expected, message = 'should be equivalent') {
    const assertionResult = {
      pass: index$1$1(actual, expected),
      actual,
      expected,
      message,
      operator: 'deepEqual'
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  equal(actual, expected, message = 'should be equal') {
    const assertionResult = {
      pass: actual === expected,
      actual,
      expected,
      message,
      operator: 'equal'
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  notOk(val, message = 'should not be truthy') {
    const assertionResult = {
      pass: !Boolean(val),
      expected: 'falsy',
      actual: val,
      operator: 'notOk',
      message
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  notDeepEqual(actual, expected, message = 'should not be equivalent') {
    const assertionResult = {
      pass: !index$1$1(actual, expected),
      actual,
      expected,
      message,
      operator: 'notDeepEqual'
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  notEqual(actual, expected, message = 'should not be equal') {
    const assertionResult = {
      pass: actual !== expected,
      actual,
      expected,
      message,
      operator: 'notEqual'
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  throws(func, expected, message) {
    let caught, pass, actual;
    if (typeof expected === 'string') {
      [expected, message] = [message, expected];
    }
    try {
      func();
    } catch (error) {
      caught = {error};
    }
    pass = caught !== undefined;
    actual = caught && caught.error;
    if (expected instanceof RegExp) {
      pass = expected.test(actual) || expected.test(actual && actual.message);
      expected = String(expected);
    } else if (typeof expected === 'function' && caught) {
      pass = actual instanceof expected;
      actual = actual.constructor;
    }
    const assertionResult = {
      pass,
      expected,
      actual,
      operator: 'throws',
      message: message || 'should throw'
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  doesNotThrow(func, expected, message) {
    let caught;
    if (typeof expected === 'string') {
      [expected, message] = [message, expected];
    }
    try {
      func();
    } catch (error) {
      caught = {error};
    }
    const assertionResult = {
      pass: caught === undefined,
      expected: 'no thrown error',
      actual: caught && caught.error,
      operator: 'doesNotThrow',
      message: message || 'should not throw'
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  fail(reason = 'fail called') {
    const assertionResult = {
      pass: false,
      actual: 'fail called',
      expected: 'fail not called',
      message: reason,
      operator: 'fail'
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  }
};

function assertion (test) {
  return Object.create(assertions, {test: {value: test}});
}

const Test = {
  run: function () {
    const assert = assertion(this);
    const now = Date.now();
    return index$1(this.coroutine(assert))
      .then(() => {
        return {assertions: this.assertions, executionTime: Date.now() - now};
      });
  },
  addAssertion(){
    const newAssertions = [...arguments].map(a => Object.assign({description: this.description}, a));
    this.assertions.push(...newAssertions);
    return this;
  }
};

function test ({description, coroutine, only = false}) {
  return Object.create(Test, {
    description: {value: description},
    coroutine: {value: coroutine},
    assertions: {value: []},
    only: {value: only},
    length: {
      get(){
        return this.assertions.length
      }
    }
  });
}

function tapOut ({pass, message, index}) {
  const status = pass === true ? 'ok' : 'not ok';
  console.log([status, index, message].join(' '));
}

function canExit () {
  return typeof process !== 'undefined' && typeof process.exit === 'function';
}

function tap () {
  return function * () {
    let index = 1;
    let lastId = 0;
    let success = 0;
    let failure = 0;

    const starTime = Date.now();
    console.log('TAP version 13');
    try {
      while (true) {
        const assertion = yield;
        if (assertion.pass === true) {
          success++;
        } else {
          failure++;
        }
        assertion.index = index;
        if (assertion.id !== lastId) {
          console.log(`# ${assertion.description} - ${assertion.executionTime}ms`);
          lastId = assertion.id;
        }
        tapOut(assertion);
        if (assertion.pass !== true) {
          console.log(`  ---
  operator: ${assertion.operator}
  expected: ${JSON.stringify(assertion.expected)}
  actual: ${JSON.stringify(assertion.actual)}
  ...`);
        }
        index++;
      }
    } catch (e) {
      console.log('Bail out! unhandled exception');
      console.log(e);
      if (canExit()) {
        process.exit(1);
      }
    }
    finally {
      const execution = Date.now() - starTime;
      if (index > 1) {
        console.log(`
1..${index - 1}
# duration ${execution}ms
# success ${success}
# failure ${failure}`);
      }
      if (failure && canExit()) {
        process.exit(1);
      }
    }
  };
}

const Plan = {
  test(description, coroutine, opts = {}){
    const testItems = (!coroutine && description.tests) ? [...description] : [{description, coroutine}];
    this.tests.push(...testItems.map(t=>test(Object.assign(t, opts))));
    return this;
  },

  only(description, coroutine){
    return this.test(description, coroutine, {only: true});
  },

  run(sink = tap()){
    const sinkIterator = sink();
    sinkIterator.next();
    const hasOnly = this.tests.some(t=>t.only);
    const runnable = hasOnly ? this.tests.filter(t=>t.only) : this.tests;
    return index$1(function * () {
      let id = 1;
      try {
        const results = runnable.map(t=>t.run());
        for (let r of results) {
          const {assertions, executionTime} = yield r;
          for (let assert of assertions) {
            sinkIterator.next(Object.assign(assert, {id, executionTime}));
          }
          id++;
        }
      }
      catch (e) {
        sinkIterator.throw(e);
      } finally {
        sinkIterator.return();
      }
    }.bind(this))
  },

  * [Symbol.iterator](){
    for (let t of this.tests) {
      yield t;
    }
  }
};

function plan$1 () {
  return Object.create(Plan, {
    tests: {value: []},
    length: {
      get(){
        return this.tests.length
      }
    }
  });
}

function compose (first, ...fns) {
  return (...args) => fns.reduce((previous, current) => current(previous), first(...args));
}

function pointer (path) {

  const parts = path.split('.');

  function partial (obj = {}, parts = []) {
    const p = parts.shift();
    const current = obj[p];
    return (current === undefined || parts.length === 0) ?
      current : partial(current, parts);
  }

  function set (target, newTree) {
    let current = target;
    const [leaf, ...intermediate] = parts.reverse();
    for (let key of intermediate.reverse()) {
      if (current[key] === undefined) {
        current[key] = {};
        current = current[key];
      }
    }
    current[leaf] = Object.assign(current[leaf] || {}, newTree);
    return target;
  }

  return {
    get(target){
      return partial(target, [...parts])
    },
    set
  }
}

function typeExpression (type) {
  switch (type) {
    case 'boolean':
      return Boolean;
    case 'number':
      return Number;
    case 'date':
      return (val) => new Date(val);
    default:
      return compose(String, (val) => val.toLowerCase());
  }
}

const not = (fn) => (input) => !fn(input);

const is = value => input => Object.is(value, input);
const lt = value => input => input < value;
const gt = value => input => input > value;
const equals = value => input => value == input;
const includes = value => input => input.includes(value);

const operators = {
  includes,
  is,
  isNot: compose(is, not),
  lt,
  gte: compose(lt, not),
  gt,
  lte: compose(gt, not),
  equals,
  notEquals: compose(equals, not)
};

const every = fns => (...args) => fns.every(fn => fn(...args));

function predicate ({value = '', operator = 'includes', type = 'string'}) {
  const typeIt = typeExpression(type);
  const operateOnTyped = compose(typeIt, operators[operator]);
  const predicateFunc = operateOnTyped(value);
  return compose(typeIt, predicateFunc);
}

//avoid useless filter lookup (improve perf)
function normalizeClauses (conf) {
  const output = {};
  const validPath = Object.keys(conf).filter(path => Array.isArray(conf[path]));
  validPath.forEach(path => {
    const validClauses = conf[path].filter(c => c.value !== '');
    if (validClauses.length) {
      output[path] = validClauses;
    }
  });
  return output;
}

function filter (filter) {
  const normalizedClauses = normalizeClauses(filter);
  const funcList = Object.keys(normalizedClauses).map(path => {
    const getter = pointer(path).get;
    const clauses = normalizedClauses[path].map(predicate);
    return compose(getter, every(clauses));
  });
  const filterPredicate = every(funcList);

  return (array) => array.filter(filterPredicate);
}

var index = plan$1()
  .test('predicate: use includes and string as default parameters', function * (t) {
    const includesFoo = predicate({value: 'foo'});
    t.ok(includesFoo('afoobar'));
    t.notOk(includesFoo('blah'));
  })
  .test('predicate use is operator on strings', function * (t) {
    const strictEqualsFoo = predicate({value: 'foo', operator: 'is'});
    t.notOk(strictEqualsFoo('afoobar'));
    t.ok(strictEqualsFoo('foo'));
  })
  .test('predicate infer number type', function * (t) {
    const greaterThanthree = predicate({value: '3', type: 'number', operator: 'gt'});
    t.ok(greaterThanthree('14'));
    t.ok(greaterThanthree(6));
    t.notOk(greaterThanthree('2'));
    t.notOk(greaterThanthree(1));
  })
  .test('predicate infer date type', function * (t) {
    const bornBeforeLaurent = predicate({value: '1987/05/21', type: 'date', operator: 'lt'});
    t.ok(bornBeforeLaurent(new Date(1986, 4, 3)));
    t.ok(bornBeforeLaurent('1982/04/11'));
    t.notOk(bornBeforeLaurent(new Date(1988, 4, 2)));
    t.notOk(bornBeforeLaurent('1990/23/10'));
  })
  .test('operator on string: includes', function * (t) {
    const includeFoo = predicate({value: 'foo', operator: 'includes'});
    t.ok(includeFoo('foo'));
    t.ok(includeFoo('adsffoob'));
  })
  .test('operator on string: is', function * (t) {
    const isFoo = predicate({value: 'foo', operator: 'is'});
    t.ok(isFoo('foo'));
    t.notOk(isFoo('adsffoob'));
  })
  .test('operator on string: isNot', function * (t) {
    const isNotFoo = predicate({value: 'foo', operator: 'isNot'});
    t.notOk(isNotFoo('foo'));
    t.ok(isNotFoo('adsffoob'));
  })
  .test('operator on string: lt', function * (t) {
    const ltFoo = predicate({value: 'foo', operator: 'lt'});
    t.ok(ltFoo('abc'));
    t.notOk(ltFoo('foo'));
  })
  .test('operator on string: lte', function * (t) {
    const lteFoo = predicate({value: 'foo', operator: 'lte'});
    t.ok(lteFoo('abc'));
    t.ok(lteFoo('foo'));
    t.notOk(lteFoo('foob'));
  })
  .test('operator on string: gt', function * (t) {
    const gtFoo = predicate({value: 'foo', operator: 'gt'});
    t.ok(gtFoo('fooa'));
    t.notOk(gtFoo('foo'));
  })
  .test('operator on string: gte', function * (t) {
    const gteFoo = predicate({value: 'foo', operator: 'gte'});
    t.ok(gteFoo('fooa'));
    t.ok(gteFoo('foo'));
    t.notOk(gteFoo('fo'));
  })
  .test('operator on string: equals', function * (t) {
    const equalsFoo = predicate({value: 'foo', operator: 'equals'});
    t.ok(equalsFoo('foo'));
    t.notOk(equalsFoo('adsffoob'));
  })
  .test('operator on string: notEquals', function * (t) {
    const notEquals = predicate({value: 'foo', operator: 'notEquals'});
    t.notOk(notEquals('foo'));
    t.ok(notEquals('adsffoob'));
  })
  .test('operator on number: is', function * (t) {
    const is42 = predicate({value: '42', type: 'number', operator: 'is'});
    t.ok(is42('42'));
    t.ok(is42(42));
    t.notOk(is42(41));
    t.notOk(is42('41'));
  })
  .test('operator on number: isNot', function * (t) {
    const isNot42 = predicate({value: '42', type: 'number', operator: 'isNot'});
    t.notOk(isNot42('42'));
    t.ok(isNot42('43'));
  })
  .test('operator on number: lt', function * (t) {
    const lt42 = predicate({value: '42', type: 'number', operator: 'lt'});
    t.ok(lt42(23));
    t.notOk(lt42('42'));
  })
  .test('operator on number: lte', function * (t) {
    const lte42 = predicate({value: '42', type: 'number', operator: 'lte'});
    t.ok(lte42('42'));
    t.ok(lte42(4));
    t.notOk(lte42(43));
  })
  .test('operator on number: gt', function * (t) {
    const gt42 = predicate({value: '42', type: 'number', operator: 'gt'});
    t.ok(gt42(43));
    t.ok(gt42('49'));
    t.notOk(gt42('42'));
  })
  .test('operator on number: gte', function * (t) {
    const gte42 = predicate({value: 42, operator: 'gte'});
    t.ok(gte42('42'));
    t.ok(gte42(432));
    t.notOk(gte42('41.9'));
  })
  .test('operator on number: equals', function * (t) {
    const equals42 = predicate({value: '42', type: 'number', operator: 'equals'});
    t.ok(equals42('42.0'));
    t.ok(equals42(42));
    t.notOk(equals42('42.1'));
  })
  .test('operator on number: notEquals', function * (t) {
    const notEquals42 = predicate({value: '42', type: 'number', operator: 'notEquals'});
    t.notOk(notEquals42('42.0'));
    t.notOk(notEquals42(42.0));
    t.ok(notEquals42('adsffoob'));
  })
  .test('operator on date: lt', function * (t) {
    const beforeBug = predicate({value: new Date(2000, 0, 0), type: 'date', operator: 'lt'});
    t.ok(beforeBug(new Date(1999, 10, 31)));
    t.notOk(beforeBug(new Date(2000, 0, 0)));
  })
  .test('operator on date: lte', function * (t) {
    const beforeDday = predicate({value: '1944/06/06', type: 'date', operator: 'lte'});
    t.ok(beforeDday(new Date(1944, 5, 6)));
    t.ok(beforeDday('1918/11/11'));
    t.notOk(beforeDday(new Date()));
  })
  .test('operator on date: gt', function * (t) {
    const afterBug = predicate({value: new Date(2000, 0, 1), type: 'date', operator: 'gt'});
    t.ok(afterBug(new Date(2000, 0, 2)));
    t.notOk(afterBug(new Date(2000)));
  })
  .test('operator on date: gte', function * (t) {
    const afterDday = predicate({value: '1944/06/06', type: 'date', operator: 'gte'});
    t.ok(afterDday(new Date(1944, 5, 7)));
    t.ok(afterDday(new Date()));
    t.notOk(afterDday('1918/11/11'));
  })
  .test('filter items: string includes', function * (t) {
    const items = [
      {foo: 'bar'},
      {foo: 'swe'},
      {foo: 'we'}
    ];
    const filtered = filter({foo: [{value: 'we'}]})(items);
    t.deepEqual(filtered, [{foo: 'swe'}, {foo: 'we'}]);
  })
  .test('filter items: combine clauses on same property', function * (t) {
    const items = [
      {foo: 'bar'},
      {foo: 'swe'},
      {foo: 'sweet'}
    ];
    const filtered = filter({foo: [{value: 'swe'}, {operator: 'is', value: 'swe'}]})(items);
    t.deepEqual(filtered, [{foo: 'swe'}]);
  })
  .test('filter items: combine clauses on different properties', function * (t) {
    const items = [
      {foo: 'bar', age: 54},
      {foo: 'swe', age: 27},
      {foo: 'sweet', age: 12}
    ];
    const filtered = filter({foo: [{value: 'swe'}], age: [{operator: 'gt', value: 12, type: 'number'}]})(items);
    t.deepEqual(filtered, [{foo: 'swe', age: 27}]);
  })
  .test('filter items: clauses on nested properties', function * (t) {
    const items = [
      {foo: 'bar', bar: {blah: 'woo'}},
      {foo: 'swe', bar: {blah: 'woo'}},
      {foo: 'sweet', bar: {blah: 'wat'}}
    ];
    const filtered = filter({foo: [{value: 'swe'}], 'bar.blah': [{operator: 'is', value: 'woo'}]})(items);
    t.deepEqual(filtered, [{foo: 'swe', bar: {blah: 'woo'}}]);
  })
  .run();

return index;

}());
