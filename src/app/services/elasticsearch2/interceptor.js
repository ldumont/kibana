define([
    'angular',
    'config',
    'lodash',
    './termsTransformer',
    './queryTransformer',
    './termStatsTransformer',
    './statisticalTransformer',
    './dateHistogramTransformer',
    './passthroughTransformer'
  ],
  function (angular, config, _, termsTransformer, queryTransformer, termStatsTransformer, statisticalTransformer,
            dateHistogramTransformer, passthroughTransformer) {
    'use strict';

    var module = angular.module('kibana.services');

    var transformers = [
      termsTransformer,
      queryTransformer,
      termStatsTransformer,
      statisticalTransformer,
      dateHistogramTransformer,

      // must be last in order to serve as fallthrough
      passthroughTransformer
    ];

    module.config(function ($httpProvider) {
      $httpProvider.interceptors.push(function () { // $log parameter not used
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
    });
  });
