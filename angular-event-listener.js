/**
 * Include this module at the root of your app and require the factories
 *
 * Will listen for events and do its best to batch them into actions. Results will be
 * console tabled. To use, simple start clicking around an app
 */
angular.module('EventListenerModule', [])
.factory('eventListener', ['$timeout', '$rootScope', function ($timeout, $rootScope) {
  (function() {
      var _$on = $rootScope.$on;
      var _$broadcast = $rootScope.$broadcast;
      var _$emit = $rootScope.$emit;
      $rootScope.$on = function(name, listener) {
        saveEvent(this.$id, '$on:register', name);
        return _$on.apply(this, arguments);
      };
      $rootScope.$broadcast = function(name, args) {
        saveEvent(this.$id, '$broadcast', name, args);
        logBroadcastListeners.call(this, name, args);
        return _$broadcast.apply(this, arguments);
      };
      $rootScope.$emit = function(name, args) {
        saveEvent(this.$id, '$emit', name, args);
        logEmitListeners.call(this, name, args);
        return _$emit.apply(this, arguments);
      };
  })();
  var lastEventTime = null;
  var lastActionTime = null;
  var lastAction = 0;
  var newActionDifference = 2000;
  var nextAction = null;
  var actionEvents = [];
  var logBroadcastListeners = function (eventName, eventArgs) {
    if (!isReportableEvent(eventName)) { return; }
    // Go down
    // Lifted from angular's rootScope.js $broadcast
    var target = this,
        current = target,
        next = target;
    if (!target.$$listenerCount[eventName]) return;
    var listeners, i, length;
    while ((current = next)) {
      listeners = current.$$listeners[eventName] || [];
      for (i = 0, length = listeners.length; i < length; i++) {
        // if listeners were deregistered, defragment the array
        if (!listeners[i]) {
          listeners.splice(i, 1);
          i--;
          length--;
          continue;
        }
        saveEvent(current.$id, '$on:$broadcast', eventName, eventArgs);
      }

      // Insanity Warning: scope depth-first traversal
      // yes, this code is a bit crazy, but it works and we have tests to prove it!
      // this piece should be kept in sync with the traversal in $digest
      // (though it differs due to having the extra check for $$listenerCount)
      if (!(next = ((current.$$listenerCount[eventName] && current.$$childHead) ||
          (current !== target && current.$$nextSibling)))) {
        while (current !== target && !(next = current.$$nextSibling)) {
          current = current.$parent;
        }
      }
    }
  };
  var logEmitListeners = function (eventName, eventArgs) {
    var empty = [],
        namedListeners,
        scope = this;
    if (!isReportableEvent(eventName)) { return; }
    // Go up
    // Lifted from angular's rootScope.js $emit
    do {
      namedListeners = scope.$$listeners[eventName] || empty;
      for (i = 0, length = namedListeners.length; i < length; i++) {

        // if listeners were deregistered, defragment the array
        if (!namedListeners[i]) {
          namedListeners.splice(i, 1);
          i--;
          length--;
          continue;
        }
        saveEvent(scope.$id, '$on:$emit', eventName, eventArgs);
      }
      //traverse upwards
      scope = scope.$parent;
    } while (scope);
  };
  var isReportableEvent = function (eventName) {
    return eventName.indexOf('$') !== 0;
  };
  var saveEvent = function (scopeId, eventType, eventName, eventArgs) {
    var dir = '';
    if (!isReportableEvent(eventName)) return;
    lastEventTime = new Date();
    if (eventType === '$on:$emit' || eventType === '$on:$broadcast') {
      dir = '<';
    } else if (eventType === '$emit' || eventType === '$broadcast') {
      dir = '-->';
    }
    actionEvents.push({
      'scopeId': scopeId,
      'dir': dir,
      'type': eventType,
      'name': eventName,
      'args': eventArgs
    });
  };
  var waitForNewAction = function () {
    var lastActionDifference;
    if (nextAction) {
      console.log(nextAction);
      nextAction = null;
    }
    if (lastEventTime) {
      lastActionDifference = (new Date()) - lastEventTime;
      if (lastActionDifference > newActionDifference && lastEventTime > lastActionTime) {
        lastAction = lastAction +1;
        console.table(actionEvents);
        startAction(lastAction);
        return;
      }
    }
    $timeout(waitForNewAction, 10);
  };
  var startAction = function(actionName) {
    nextAction = "ACTION:", actionName.toString();
    actionEvents = [];
    lastActionTime = new Date();
    waitForNewAction();
  };
  startAction('pageLoad');
  return {};
}]);
