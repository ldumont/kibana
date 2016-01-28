define([
  'angular',
  'lodash',
  'config'
],
function (angular, lodash, config) {

  var module = angular.module('kibana.services');

  module.config(function($httpProvider){
    $httpProvider.interceptors.push(function($log) {
      return {
       'request': function(config) {
           $log.log({
             interceptor: 'es2Interceptor',
             outgoing: config
           });

           return config;
        },

        'response': function(response) {
           $log.log({
             interceptor: 'es2Interceptor',
             incoming: response
           });

           return response;
        }
      };
    });
  })
});
