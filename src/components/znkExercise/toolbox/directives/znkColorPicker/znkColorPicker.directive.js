(function (angular) {
  'use strict';

  angular.module('znk.infra.znkExercise').component('znkColorPicker', {
    templateUrl: 'components/znkExercise/toolbox/directives/znkColorPicker/znkColorPicker.template.html',
    bindings: {
      pickedColor: '=',
      colors: '=?'
    },
    controllerAs: 'vm',
    controller: function ($log) {
      'ngInject';
      var vm = this;
      $log.debug(vm);
    }

  });
})(angular);
