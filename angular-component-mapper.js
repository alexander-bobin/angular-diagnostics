/**
 * Include this module at the root of your app and require the factory
 * 
 * Will console log JSON representing tree structure of modules only (outputModules()) or
 * modules and components (outputModulesAndComponents())
 *
 * Usage:
 * - Search for 'COMMENT IN TO RUN' to use it
 * - Replace name_of_root_module with the name of your root module
 */
angular.module('ComponentMapperModule', [])
.factory('componentMapper', ['$timeout', function ($timeout) {

  var getBaseTreeList = function(moduleName, moduleIgnorePatterns) {
    var mod = angular.module(moduleName);
    var requiredModules = [];
    var components = [];
    var getComponentType = function (componentData) {
      if (componentData[1] !== 'register') { return componentData[1]; }
      if (componentData[0] === '$controllerProvider') { return 'controller'; }
      if (componentData[0] === '$filterProvider') { return 'filter'; }
      return 'unknown';
    };
    var getFunctionParamNames = function (fn) {
      var funStr = fn.toString();
      return funStr.slice(funStr.indexOf('(') + 1, funStr.indexOf(')')).match(/([^\s,]+)/g);
    };
    var getComponentInjectables = function (componentData) {
      var injectables = [],
          inspectable = componentData[2][1];
      if (angular.isArray(inspectable)) {
        for (var i = 0; i < inspectable.length; i++) {
          if (typeof inspectable[i] === 'string') {
            injectables.push(inspectable[i]);
          }
        }
      } else if (typeof inspectable === "function") {
        injectables = getFunctionParamNames(inspectable);
      }
      return injectables;
    };
    var isIgnorable = function (name, patterns) {
      var ignore = false;
      for (var i = 0; i < patterns.length; i++) {
        if (name.match(patterns[i]) !== null) {
          ignore = true;
        }
      }
      return ignore;
    };
    var ignore = isIgnorable(moduleName, moduleIgnorePatterns);

    if (!ignore) {
      for (var i = 0; i < mod.requires.length; i++) {
        requiredModules.push(getBaseTreeList(mod.requires[i], moduleIgnorePatterns));
      }

      for (var j = 0; j < mod._invokeQueue.length; j++) {
        var componentData = mod._invokeQueue[j];
        components.push({
          'name': componentData[2][0],
          'type': getComponentType(componentData),
          'injected': getComponentInjectables(componentData)
        });
      }
    }

    return {
      'name': mod.name + (ignore ? ' IGNORED' : ''),
      'requires': requiredModules,
      'has': components
    };
  };

  /**
   * Create { name: '', children: [ { name: '', ... }] }
   * @param  {object} data Base tree baseData
   * @return {object}
   */
  var createD3TreeBranch = function (data) {
    var children = [];
    // Add modules as children
    for (var i = 0; i < data.requires.length; i++) {
      children.push(createD3TreeBranch(data.requires[i]));
    }
    // Add components as children with type <type>
    for (var j = 0; j < data.has.length; j++) {
      children.push({
        'name': data.has[j].name,
        'type': data.has[j].type
      });
    }
    return {
      'name': data.name,
      'type': 'module',
      'children': children
    };
  };

  /**
   * Will console log a JSON structure representing modules and components (controllers etc)
   * @param  {string} moduleName Name of starting module
   */
  var outputModulesAndComponents = function (moduleName) {
    var moduleIgnorePatterns = [
      /^ui\./g,
      /^ng/g
    ];
    var baseData = getBaseTreeList(moduleName, moduleIgnorePatterns);
    console.log(JSON.stringify(createD3TreeBranch(baseData)));
  };

  // TREE MODULES
  // ============
  var collectModulesLeaves = function(moduleName) {
    var mod = angular.module(moduleName);
    var children = [];
    for (var i = 0; i < mod.requires.length; i++) {
      children.push(collectModulesLeaves(mod.requires[i]));
    };
    return {
      name: mod.name,
      children: children
    };
  };

  /**
   * Will console log a JSON structure representing modules
   * @param  {string} moduleName Name of starting module
   */
  var outputModules = function(moduleName) {
    var moduleList = collectModulesLeaves(moduleName);
    console.log(JSON.stringify(moduleList));
  };

  // COMMENT IN TO RUN
  // Replace name_of_root_module
  // $timeout(function() {
  //   outputModules('name_of_root_module');
  //   outputModulesAndComponents('name_of_root_module');
  // }, 1);

  return {};
}]);
