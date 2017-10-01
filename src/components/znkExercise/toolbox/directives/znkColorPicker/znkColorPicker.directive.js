(function (angular) {
  'use strict';

  angular.module('znk.infra.znkExercise').component('znkColorPicker', {
    templateUrl: 'components/znkExercise/toolbox/directives/znkColorPicker/znkColorPicker.template.html',
    bindings: {
      pickedColor: '=',
      colors: '=?'
    },
    controllerAs: 'vm',
    controller: function () {
      'ngInject';
      var vm = this;
      vm.colorsArr = [
        {
          code:'#008000'
        },
        {
          code:'#ff0000'
        },
        {
          code:'#3500ff'
        },
        {
          code:'#e1ff00'
        },
        {
          code:'#ff00dd'
        },
        {
          code:'#000000'
        }
      ];
      vm.pickedColor = function(colorCode) {
        vm.pickedColor = colorCode;
      };
    }

  });
})(angular);
