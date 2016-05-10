define([
],
function () {
  'use strict';

  return {
    condition: function(){ // config parameter not used
      return true;
    },

    request: function(config){ 
      return config;
    },

    response: function(response){
      return response;
    }
  };
});
