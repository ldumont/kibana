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
				var termsStatsMode = !!facetData.facets.terms.terms_stats;
				var order = termsStatsMode ? facetData.facets.terms.terms_stats.order : facetData.facets.terms.terms.order;
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
				case "total":
					sortTerm = "terms_stats.sum";
					sortOrder = "desc";
					break;
				case "reverse_total":
					sortTerm = "terms_stats.sum";
					sortOrder = "asc";
					break;
				case "min":
					sortTerm = "terms_stats.min";
					sortOrder = "desc";
					break;
				case "reverse_min":
					sortTerm = "terms_stats.min";
					sortOrder = "asc";
					break;
				case "max":
					sortTerm = "terms_stats.max";
					sortOrder = "desc";
					break;
				case "reverse_max":
					sortTerm = "terms_stats.max";
					sortOrder = "asc";
					break;
				case "mean":
					sortTerm = "terms_stats.avg";
					sortOrder = "desc";
					break;
				case "reverse_mean":
					sortTerm = "terms_stats.avg";
					sortOrder = "asc";
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
										field: termsStatsMode ? facetData.facets.terms.terms_stats.key_field : facetData.facets.terms.terms.field,
										size: termsStatsMode ? facetData.facets.terms.terms_stats.size : facetData.facets.terms.terms.size,
										min_doc_count: 1,
										order: orderData
									}
								},
								terms_missing: {
									missing: {
										field: termsStatsMode ? facetData.facets.terms.terms_stats.key_field : facetData.facets.terms.terms.field
									}
								}
							}
						}
					},
					size: facetData.size
				};
				if (termsStatsMode) {
					aggregationsData.aggs.fquery.aggs.terms_result.aggs = {
						terms_stats: {
							stats: { field: facetData.facets.terms.terms_stats.value_field }
						}
					};
				}

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
								if (bucket['terms_stats']) {
									return {
										term: bucket.key,
										count: bucket['doc_count'],
										total_count: bucket['doc_count'],
										min: bucket['terms_stats'].min,
										max: bucket['terms_stats'].max,
										total: bucket['terms_stats'].sum,
										mean: bucket['terms_stats'].avg
									};
								}
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
