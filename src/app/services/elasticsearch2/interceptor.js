define([
  'angular',
  'config',
  'lodash',
  './termsTransformer',
  './passthroughTransformer'
],
function (angular, config, _, termsTransformer, passthroughTransformer) {

  var module = angular.module('kibana.services');

  var transformers = [
    termsTransformer,
    // must be last
    passthroughTransformer
  ];

  module.config(function($httpProvider){
    $httpProvider.interceptors.push(function($log) {
      return {
       'request': function(config) {
         config.es2Transformer = transformers[_.findIndex(transformers, function(t) { return t.condition(config); })];

           return config.es2Transformer.request(config);
        },

        'response': function(response) {
           return response.config.es2Transformer.response(response);
        }
      };
    });
  })
});
