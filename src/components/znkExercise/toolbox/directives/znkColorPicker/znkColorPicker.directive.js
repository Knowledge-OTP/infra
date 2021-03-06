(function (angular) {
  'use strict';

  angular.module('znk.infra.znkExercise').component('znkColorPicker', {
    templateUrl: 'components/znkExercise/toolbox/directives/znkColorPicker/znkColorPicker.template.html',
    bindings: {
      colors: '=?',
      pickedColorCb: "="
    },
    controllerAs: 'vm',
    controller: function () {
      'ngInject';
      var vm = this;
      vm.colorsArr = [
        {
          code: '#008000'
        },
        {
          code: '#ff0000'
        },
        {
          code: '#af667d'
        },
        {
          code: '#e1ff00'
        },
        {
          code: '#ff00dd'
        },
        {
          code: '#000000'
        }
      ];
      vm.pickColor = function (colorCode) {
        if (vm.pickedColorCb) {
          vm.pickedColorCb(colorCode);
        }
      };
    }

  });
})(angular);
