define([
  'angular',
  'config',
  'lodash',
  './termsTransformer',
  './queryTransformer',
  './termStatsTransformer',
  './statisticalTransformer',
  './dateHistogramTransformer'
],
function (angular, config, _, termsTransformer, queryTransformer, termStatsTransformer, statisticalTransformer, dateHistogramTransformer) {

  var module = angular.module('kibana.services');

  var transformers = [
    termsTransformer,
    queryTransformer,
    termStatsTransformer,
    statisticalTransformer,
    dateHistogramTransformer,
  ];

  module.config(function($httpProvider){
    var requestedVersion = config.elasticsearch_version || 'auto';

    if (requestedVersion === 'auto' || requestedVersion === 2) {
      $httpProvider.interceptors.push(function($log, $elasticsearch_version) {
        return {
          'request': function(config) {
            return $elasticsearch_version.when(function (version) {
              if (version === 2) {
                config.es2Transformer = transformers[_.findIndex(transformers, function(t) { return t.condition(config); })];

                if (config.es2Transformer)
                  return config.es2Transformer.request(config);
              }

              return config;
            });
          },

          'response': function(response) {
            if (response.config.es2Transformer)
              return response.config.es2Transformer.response(response);

            return response;
          }
        };
      });
    }
  });

  var elasticsearch_version_detected = angular.isNumber(config.elasticsearch_version);
  var elasticsearch_version_deferred;

  module.factory('elasticsearch_version', function($q, $http) {
    if (angular.isNumber(config.elasticsearch_version))
      return $q.when(config.elasticsearch_version);

    elasticsearch_version_deferred = $q.defer();
    return elasticsearch_version_deferred.promise;
  });


});
