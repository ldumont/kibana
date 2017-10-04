define([],
	function () {
		'use strict';

		return {
			request: function (config) {
                if (!config || !config.data) {
                    return config;
                }
                var data = angular.fromJson(config.data);
                var changed = false;

                // Find and remove (if any) `ignore_unmapped` pram from sort
                // TODO: not sure if we need to simply delete this? Clarify and refactor if needed
                if (angular.isArray(data.sort)) {
                    changed = true;
                    for (var i = 0; i < data.sort.length; i++) {
                        var sortItem = data.sort[i];

                        if (!angular.isObject(sortItem)) {
                            return;
                        }
                        for (var key in sortItem) {
                            delete sortItem[key].ignore_unmapped;
                        }
                    }
                }

                // Find and replace (if any) filtered queries with with bool queries
                if (data.query && data.query.filtered && data.query.filtered.query) {
                    changed = true;
                    data.query.filtered.must = data.query.filtered.query;
                    delete data.query.filtered.query;
                    data.query.bool = data.query.filtered;
                    delete data.query.filtered;
                }
                console.log(data);
                if (changed) {
                    config.data = angular.toJson(data);
                }
				return config;
			}
		};
	});
