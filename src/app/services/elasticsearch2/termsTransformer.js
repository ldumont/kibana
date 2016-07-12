define([
		'angular',
		'lodash'
	],
	function (angular, _) {
		'use strict';
		var signature = /^\{\"facets\":\{\"terms\":/;

		return {
			condition: function (config) {
				return (/\/_search$/).test(config.url) && signature.test(config.data);
			},

			request: function (config) {
				var facetData = angular.fromJson(config.data);

				var aggregationsData = {
					aggs: {
						fquery: {
							filter: facetData.facets.terms.facet_filter.fquery,
							aggs: {
								terms_result: {
									terms: {
										field: facetData.facets.terms.terms.field,
										size: facetData.facets.terms.terms.size,
										min_doc_count: 1
									}
								},
								terms_missing: {
									missing: {
										field: facetData.facets.terms.terms.field
									}
								}
							}
						}
					},
					size: facetData.size
				};

				config.data = angular.toJson(aggregationsData);

				return config;
			},

			response: function (response) {
				var data = response.data;

				data.facets = {
					terms: {
						_type: 'terms',
						missing: data.aggregations.fquery.terms_missing.doc_count,
						total: data.aggregations.fquery.doc_count,
						other: data.aggregations.fquery.terms_result.sum_other_doc_count,
						terms: _.map(data.aggregations.fquery.terms_result.buckets, function (bucket) {
							return {
								term: bucket.key,
								count: bucket.doc_count
							};
						})
					}
				};

				return response;
			}
		};
	});