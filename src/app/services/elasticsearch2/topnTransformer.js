define([
  'angular',
  'lodash'
],
function (angular,_) {
  var signature = /^\{\"facets\":\{\"query\":\{\"terms\":\{\"field\"/;

  return {
    condition: function(config){
      return /\/_search$/.test(config.url) && signature.test(config.data);
    },

    request: function(config){
      var facetData = angular.fromJson(config.data);

      var aggregationsData = {};
      aggregationsData.aggs = facetData.facets;

      aggregationsData.query = facetData.facets.query.facet_filter.fquery.query;
      delete aggregationsData.aggs.query.facet_filter;

      aggregationsData.size = 0;

      config.data = angular.toJson(aggregationsData);

      return config;
    },

    response: function(response){
      response.data.facets = {};
      response.data.facets = response.data.aggregations;
      response.data.facets.query.terms = response.data.aggregations.query.buckets;

      delete response.data.facets.query.buckets;
      delete response.data.aggregations;

      for(b of response.data.facets.query.terms) {
        b.count = b.doc_count;
        b.term = b.key;
      };

      return response;
    }
  }
});
