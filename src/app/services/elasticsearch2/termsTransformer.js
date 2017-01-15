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
				var order = facetData.facets.terms.terms.order;
				var sortTerm, sortOrder;

				switch (order){
				case "count":
					sortTerm = "_count";
					sortOrder = "desc";
					break;
				case "reverse_count":
					sortTerm = "_count";
					sortOrder = "asc";
					break;
				case "term":
					sortTerm = "_term";
					sortOrder = "asc";
					break;
				case "reverse_term":
					sortTerm = "_term";
					sortOrder = "desc";
					break;
				}
				var orderData = {};
				orderData[sortTerm] = sortOrder;
				
				var aggregationsData = {
					aggs: {
						fquery: {
							filter: facetData.facets.terms.facet_filter.fquery,
							aggs: {
								terms_result: {
									terms: {
										field: facetData.facets.terms.terms.field,
										size: facetData.facets.terms.terms.size,
										min_doc_count: 1,
										order: orderData
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