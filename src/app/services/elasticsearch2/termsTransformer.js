define([
  'lodash'
],
function (_) {
  return {
    condition: function(config){
      return config.url.endsWith('/_search') && /^\{\"facets\":\{\"terms\":/.test(config.data);
    },

    request: function(config){
      console.warn({
        interceptor: 'termsTransformer',
        outgoing: config
      });

      return config;
    },
    
    response: function(response){
      console.warn({
        interceptor: 'termsTransformer',
        incoming: response
      });

      return response;
    }
  }
});
