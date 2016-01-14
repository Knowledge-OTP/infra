(function (angular) {
    'use strict';

    angular.module('testUtility').service('MockDrvCtrlSrv', [
        '$controller',
        function ($controller) {
            this.mock = function mock(element,directiveName, ctrl){
                if(!ctrl){
                    try{
                        ctrl = $controller(directiveName + 'Ctrl.mock');
                    }catch(e){
                        ctrl = {};
                    }
                }
                element.data('$' + directiveName + 'Controller', ctrl);
                return ctrl;
            };
        }
    ]);
})(angular);
