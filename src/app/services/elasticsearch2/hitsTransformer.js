define([
  'angular',
  'lodash'
],
function (angular,_) {
  var signature = /^\{\"facets\":\{\"0\":\{\"query\":\{\"filtered\":\{\"query\"/;

  return {
    condition: function(config){
      return /\/_search$/.test(config.url) && signature.test(config.data);
    },

    request: function(config){
      var facetData = angular.fromJson(config.data);

      var aggregationsData = {};
      aggregationsData.aggs = {};

      var fLen = Object.keys(facetData["facets"]).length;

      for (var i=0; i < fLen; i++) {
        aggregationsData["aggs"][i] = {};
        aggregationsData["aggs"][i]["filter"] = facetData["facets"][i];
      }

      aggregationsData.size = 0;

      config.data = angular.toJson(aggregationsData);

      return config;
    },

    response: function(response){
      var data = response.data;

      var facetsData = {};

      data.facets = data.aggregations;

      for (var b in data.facets) {
        data["facets"][b]["count"] = data["facets"][b]["doc_count"];
        data["facets"][b]["_type"] = "query";
      }

      return response;
    }
  }
});
