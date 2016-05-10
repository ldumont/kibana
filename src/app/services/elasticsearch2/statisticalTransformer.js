define([
    'angular',
    'lodash'
  ],
  function (angular, _) {
    'use strict';

    var signature = /^\{\"facets\":\{\"stats\":\{\"statistical\":/;

    return {
      condition: function (config) {
        return (/\/_search$/).test(config.url) && signature.test(config.data);
      },

      request: function (config) {
        var facetData = angular.fromJson(config.data);

        var aggregationsData = {
          aggs: {},
          size: facetData.size
        };

        _.forOwn(facetData.facets, function (num, key) {
          var facet = facetData.facets[key];

          var aggregation = {
            filter: facet.facet_filter.fquery,
            aggs: {
              stats: {
                extended_stats: {
                  field: facet.statistical.field
                }
              }
            }
          };

          aggregationsData.aggs[key] = aggregation;
        });

        config.data = angular.toJson(aggregationsData);

        return config;
      },

      response: function (response) {
        var data = response.data;

        data.facets = {};

        _.forOwn(data.aggregations, function (num, key) {
          var aggregation = data.aggregations[key];

          data.facets[key] = {
            _type: 'statistical',
            total: aggregation.doc_count,
            count: aggregation.stats.count,
            min: aggregation.stats.min,
            max: aggregation.stats.max,
            mean: aggregation.stats.avg,
            sum: aggregation.stats.sum,
            sum_of_squares: aggregation.stats.sum_of_squares,
            variance: aggregation.stats.variance,
            std_deviation: aggregation.stats.std_deviation
          };
        });

        return response;
      }
    };
  });