

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatBoard', [
        function () {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/chatBoard.template.html',
                require:'ngModel',
                scope: {

                },
                link: function (scope, element, ctr, ngModelCtrl) {
                    scope.d = {};
                    
                    ngModelCtrl.$render = function (){
                        scope.d.selectedChatter = ngModelCtrl.$modelValue;
                    }

                }
            };
        }
    ]);
})(angular);

