define([
  'angular',
  'lodash'
],
function (angular,_) {
  var signature = /^\{\"facets\":\{\"0\":\{\"date_histogram\":\{\"key_field\":\".*?\",\"value_field\":\".*?\",\"interval\":\".*?\"\}/;

  return {
    condition: function(config){
      return /\/_search\?search_type=count$/.test(config.url) && signature.test(config.data);
    },

    request: function(config){
      var facetData = angular.fromJson(config.data);

      var aggregationsData = {
        aggs:{},
        size: facetData.size
      };

      _.forOwn(facetData.facets, function(num, key){
        var facet = facetData.facets[key];
        var aggregations = {};

        aggregations[key] = { date_histogram: { interval: facet.date_histogram.interval, field: facet.date_histogram.key_field } };

        aggregations[key]["aggs"] = {};
        aggregations[key]["aggs"][1] = { stats: { field: facet.date_histogram.value_field } };

        aggregationsData.aggs[key] = {
          filter: facet.facet_filter.fquery,
          aggs: aggregations
        };
      });

      config.data = angular.toJson(aggregationsData);

      return config;
    },

    response: function(response){
      var data = response.data;

      var facetsData = {};

      _.forOwn(data.aggregations, function(num, key){
        var agregation = data.aggregations[key];

        var facet = {
          _type: 'date_histogram',
          entries: _.map(agregation[key].buckets, function(bucket){
            return {
              time: bucket.key,
              count: bucket.doc_count,
              total_count: bucket.doc_count,
              max: bucket[1]["max"],
              mean: bucket[1]["avg"],
              min: bucket[1]["min"]
            };
          })
        };

        facetsData[key] = facet;
      });

      data.facets = facetsData;

      return response;
    }
  }
});
