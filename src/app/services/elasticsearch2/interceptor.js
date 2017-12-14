define([
		'angular',
		'config',
		'lodash',
		'./trendsTransformer',
		'./topnTransformer',
		'./termsTransformer',
		'./statisticalTransformer',
		'./dateHistogramTransformer',
		'./histogramTransformer',
		'./hitsTransformer',
		'./passthroughTransformer',
		'./es5Transformer'
	],
	function (angular, config, _, trendsTransformer, topnTransformer, termsTransformer,
            statisticalTransformer, dateHistogramTransformer, histogramTransformer,
            hitsTransformer, passthroughTransformer, es5Transformer) {
		'use strict';

		var transformers = [
			topnTransformer,
			trendsTransformer,
			termsTransformer,
			statisticalTransformer,
			dateHistogramTransformer,
			histogramTransformer,
			hitsTransformer,
			passthroughTransformer
		];

		var module = angular.module('kibana.services');

		module.config(function ($httpProvider) {
			var requestedVersion = config.elasticsearch_version || 5;

			if (!angular.isNumber(requestedVersion)) {
				return;
			}
			if (requestedVersion === 2 || requestedVersion === 5) {
				$httpProvider.interceptors.push(function () { // $log unused
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
			if (requestedVersion === 5) {
				$httpProvider.interceptors.push(function () {
					return {
						'request': function (config) {
							return es5Transformer.request(config);
						}
					};
				});
			}
		});
	});
