(function() {
'use strict';

    angular
        .module('Module')
        .filter('Filter', Filter);

    function Filter() {
        return FilterFilter;

        ////////////////

        function FilterFilter(Params) {
            return Params;
        }
    }
})();