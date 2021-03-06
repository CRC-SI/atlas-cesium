var tests = [];
var specsConfig = [
  {name: 'camera/Camera', run: false},
  {name: 'model/Ellipse', run: false},
  {name: 'model/Handle', run: false},
  {name: 'model/Mesh', run: false},
  {name: 'render/LocalTerrainData', run: true}
];

var warnings = '\n';
specsConfig.forEach(function(config) {
  if (config.run) {
    tests.push('/base/atlas-cesium/test/specs/' + config.name + 'Spec.js');
  } else {
    warnings += 'Not running test spec: ' + config.name;
    config.fix && (warnings += ', fix: ' + config.fix);
    warnings += '\n';
  }
});
/* global console */
warnings !== '\n' && console.log(warnings);

/* global requirejs,window */
requirejs.config({
  // Karma serves files from '/base'.
  baseUrl: '/base',

  packages: [
    {name: 'atlas', location: 'atlas/src'},
    {name: 'atlas/lib', location: 'atlas/lib'},
    {name: 'atlas/lib/utility', location: 'atlas/lib/utility/src'},
    {name: 'atlas/assets', location: 'atlas/assets'}, // Only need this for testing
    {name: 'atlas-cesium/cesium', location: 'atlas-cesium/lib/cesium'},
    {name: 'atlas-cesium/lib', location: 'atlas-cesium/lib'},
    {name: 'atlas-cesium', location: 'atlas-cesium/src'},
    // Provides access to test utilities.
    {name: 'atlas-cesium/test/util', location: 'atlas-cesium/test/util'},
    {name: 'jquery', location: 'atlas/lib', main: 'jquery'},
    {name: 'underscore', location: 'atlas/lib/underscore', main: 'underscore'},
    {name: 'utm-converter', location: 'atlas/lib', main: 'UtmConverter.js'}
  ],

  // Ask requirejs to load these files.
  deps: tests,

  // Start tests running once requirejs is done.
  callback: function() {
    // Add custom Jasmine matchers.
    beforeEach(function() {
      jasmine.addMatchers({
        toDeepEqual: function(util, customEqualityTesters) {
          return {
            compare: function(actual, expected) {
              var result = {};
              result.pass = _.isEqual(actual, expected);
              return result;
            }
          }
        }
      });
    });

    window.__karma__.start();
  }
});
