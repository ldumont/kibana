define([
  'angular',
  'config',
  'lodash',
  './termsTransformer',
  './dummyTransformer'
],
function (angular, config, _, termsTransformer, dummyTransformer) {

  var module = angular.module('kibana.services');

  var transformers = [
    termsTransformer
  ];

  module.config(function($httpProvider){
    $httpProvider.interceptors.push(function($log) {
      return {
       'request': function(config) {
         var transformerIndex = _.findIndex(transformers, function(t) { return t.condition(config); });
         config.es2InterceptorTransformer = (transformerIndex > -1) ? transformers[transformerIndex] : dummyTransformer;

           return config.es2InterceptorTransformer.request(config);
        },

        'response': function(response) {
           return response.config.es2InterceptorTransformer.response(response);
        }
      };
    });
  })
});
