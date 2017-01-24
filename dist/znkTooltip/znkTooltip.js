(function (angular) {
    'use strict';

    angular.module('znk.infra.znkTooltip', [
        'ngMaterial',
        'pascalprecht.translate',
        'ngSanitize'
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkTooltip')
        .directive('znkTooltip',
            function () {
                'ngInject';
                return {
                link: function() {

                    var divElm = document.createElement('div');
                    divElm.classList.add('arrow');

                    var mdContent = angular.element(document.querySelector('.md-content'));

                    mdContent.append(divElm);
                }
            };
        });
})(angular);

angular.module('znk.infra.znkTooltip').run(['$templateCache', function($templateCache) {

}]);
