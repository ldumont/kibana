define([
  'angular',
  'config',
  'lodash',
  './termsTransformer',
  './statsTransformer',
  './histogramTransformer',
  './passthroughTransformer'
],
function (angular, config, _, termsTransformer, statsTransformer, histogramTransformer, passthroughTransformer) {

  var module = angular.module('kibana.services');

  var transformers = [
    termsTransformer,
    statsTransformer,
    histogramTransformer,
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
