define([
    'angular',
    'config',
    'lodash',
    './termsTransformer',
    './statisticalTransformer',
    './dateHistogramTransformer',
    './passthroughTransformer'
  ],
  function (angular, config, _, termsTransformer, statisticalTransformer, dateHistogramTransformer, passthroughTransformer) {
    'use strict';
    var module = angular.module('kibana.services');

    var transformers = [
      termsTransformer,
      statisticalTransformer,
      dateHistogramTransformer,

      // must be last in order to serve as fallthrough
      passthroughTransformer
    ];

    module.config(function ($httpProvider) {
      var requestedVersion = config.elasticsearch_version || 2;

      if (angular.isNumber(requestedVersion) && requestedVersion === 2) {
        $httpProvider.interceptors.push(function ($log) {
          return {
            'request': function (config) {
              config.es2Transformer = transformers[_.findIndex(transformers, function (t) {
                return t.condition(config);
              })];

              return config.es2Transformer.request(config);
            },

            'response': function (response) {
              return response.config.es2Transformer.response(response);
            }
          };
        });
      }
    });
  });
