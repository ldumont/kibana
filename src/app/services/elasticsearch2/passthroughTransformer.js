define([
],
function () {
  return {
    condition: function(config){
      return true;
    },

    request: function(config){
      console.info({
        interceptor: 'dummyTransformer',
        outgoing: config
      });

      return config;
    },
    
    response: function(response){
      console.info({
        interceptor: 'dummyTransformer',
        incoming: response
      });

      return response;
    }
  }
});
