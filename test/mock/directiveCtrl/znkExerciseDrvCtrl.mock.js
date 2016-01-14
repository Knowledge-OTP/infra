(function (angular) {
    'use strict';

    angular.module('testUtility').controller('znkExerciseCtrl.mock', [
        '$q',function ($q) {
            var self = this;

            self.settings = {
                viewMode: 1
            };

            self.getViewMode = function(){
                return self.settings.viewMode;
            };

            self.setCurrentIndex = function(index){
                return $q.when(index);
            };
        }
    ]);
})(angular);
