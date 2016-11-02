
(function (angular) {
    'use strict';
    angular.module('znk.infra.znkLesson').service('LessonSrv',

        function(ENV, StorageSrv) {
            'ngInject';
            
            var vm = this;
            
            // vm.reportData.app = ENV.firebaseAppScopeName.split('_')[0].toUpperCase();
            // vm.reportData.email = userAuth.auth.email;
            
            vm.saveLesson = function () {
                
            }
        }
    );
})(angular);

