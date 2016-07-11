define([
  'angular',
  'lodash'
],
function (angular,_) {
  var signature = /^\{\"facets\":\{\"0\":\{\"date_histogram\":\{\"field\":\".*?\",\"interval\":\".*?\"\}/;

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

        aggregations[key] = {
          date_histogram: facet.date_histogram
        };

        var aggregationsData = {
          aggs: {},
          size: facetData.size
        };

        _.forOwn(facetData.facets, function (num, key) {
          var facet = facetData.facets[key];
          var aggregations = {};

          aggregations[key] = {
            date_histogram: facet.date_histogram
          };

          aggregationsData.aggs[key] = {
            filter: facet.facet_filter.fquery,
            aggs: aggregations
          };
        });

        config.data = angular.toJson(aggregationsData);

        return config;
      },

      response: function (response) {
        var data = response.data;

        var facetsData = {};

        _.forOwn(data.aggregations, function (num, key) {
          var agregation = data.aggregations[key];

          var facet = {
            _type: 'date_histogram',
            entries: _.map(agregation[key].buckets, function (bucket) {
              return {
                time: bucket.key,
                count: bucket.doc_count
              };
            })
          };

          facetsData[key] = facet;
        });

        data.facets = facetsData;

        return response;
      }
    };
  });