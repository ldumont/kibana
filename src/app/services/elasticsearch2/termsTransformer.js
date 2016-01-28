define([
  'lodash'
],
function (lodash) {
  return {
    condition: function(config){
      return true;
    },
    request: function(config){
      console.log({
        interceptor: 'termsTransformer',
        outgoing: config
      });

      return config;
    },
    response: function(response){
      console.log({
        interceptor: 'termsTransformer',
        incoming: response
      });

      return response;
    }
  }
});
