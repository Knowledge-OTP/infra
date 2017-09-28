(function (angular) {
  'use strict';

  angular.module('znk.infra.znkExercise').component('znkColorPicker', {
    templateUrl: 'components/znkExercise/toolbox/directives/znkColorPicker/znkColorPicker.template.html',
    bindings: {
      pickedColor: '<',
      colors: '=?'
    },
    controller: function () {
      'ngInject';
      // var ctrl = this;
    }

  });
})(angular);
