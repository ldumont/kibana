define([
],
function () {
  return {
    condition: function(config){
      return true;
    },
    request: function(config){
      console.log({
        interceptor: 'dummyTransformer',
        outgoing: config
      });

      return config;
    },
    response: function(response){
      console.log({
        interceptor: 'dummyTransformer',
        incoming: response
      });

      return response;
    }
  }
});
