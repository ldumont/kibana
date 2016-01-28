define([
],
function () {
  return {
    condition: function(config){
      return true;
    },

    request: function(config){
      return config;
    },

    response: function(response){
      return response;
    }
  }
});
