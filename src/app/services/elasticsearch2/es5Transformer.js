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
                // TODO: this is only for debug, remove:
                var originalUrl = config.url;

                // Replace `search_type=count` which is deprecated in ES5
                if (config.url.indexOf('search_type=count') !== -1) {
                    changed = true;
                    config.url = config.url.replace('search_type=count', 'search_type=query_then_fetch');
                    data.size = 0;
                }

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

                changed = replaceFiltered(data) || changed;
                changed = replaceFquery(data) || changed;
                changed = replaceQueryUnderFilter(data) || changed;

                if (changed) {
                    // TODO: remove logs after ES5 support implementation is finished
                    // console.log('');
                    // console.log('*************************************');
                    // console.log('ES5 transformer processed request:');
                    // console.log(config.method + ' ' + originalUrl);
                    // console.log('Transformed URL: ' + config.url);
                    // console.log('Original payload:');
                    // console.log(config.data);
                    // console.log('Transformed payload:');
                    // console.log(angular.toJson(data));
                    // console.log('*************************************');
                    // console.log('');

                    config.data = angular.toJson(data);
                }
				return config;
			}
        };

        function replaceFiltered(obj) {
            var changed = false;

            Object.getOwnPropertyNames(obj).forEach(
                function (propertyName) {
                    if (propertyName === 'filtered' && obj.filtered && obj.filtered.query) {
                        changed = true;
                        obj.filtered.must = obj.filtered.query;
                        delete obj.filtered.query;
                        obj.bool = obj.filtered;
                        delete obj.filtered;
                    } else if (angular.isObject(obj[propertyName]) || angular.isArray(obj[propertyName])) {
                        changed = replaceFiltered(obj[propertyName]) || changed;
                    }
                }
            );
            return changed;
        }

        function replaceFquery(obj) {
            var changed = false;

            Object.getOwnPropertyNames(obj).forEach(
                function (propertyName) {
                    if (propertyName === 'fquery' && obj.fquery && obj.fquery.query && obj.fquery.query.query_string) {
                        changed = true;
                        obj.query_string = obj.fquery.query.query_string;
                        delete obj.fquery;
                    } else if (angular.isObject(obj[propertyName]) || angular.isArray(obj[propertyName])) {
                        changed = replaceFquery(obj[propertyName]) || changed;
                    }
                }
            );
            return changed;
        }

        function replaceQueryUnderFilter(obj) {
            var changed = false;

            Object.getOwnPropertyNames(obj).forEach(
                function (propertyName) {
                    if (propertyName === 'filter' && obj.filter && obj.filter.query) {
                        changed = true;
                        obj.filter = obj.filter.query;
                        delete obj.query;
                    } else if (angular.isObject(obj[propertyName]) || angular.isArray(obj[propertyName])) {
                        changed = replaceQueryUnderFilter(obj[propertyName]) || changed;
                    }
                }
            );
            return changed;
        }
	});
