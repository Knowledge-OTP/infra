(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').component('callsAudioTag', {
            templateUrl: 'components/calls/directives/audioTag/audioTag.template.html',
            require: {
                parent: '?^ngModel'
            },
            controllerAs: 'vm',
            controller: function ($element) {

                var vm = this;

                var audioTag = $element.find('audio')[0];

                function stopAudio() {
                    audioTag.pause();
                    audioTag.currentTime = 0;
                }

                vm.$onInit = function() {
                    var ngModelCtrl = vm.parent;
                    if (ngModelCtrl) {
                        ngModelCtrl.$render = function() {
                            var modelValue = ngModelCtrl.$modelValue;
                            if (angular.isDefined(modelValue.stopPlay) && modelValue.stopPlay === true) {
                                stopAudio();
                            }
                        };
                    }
                };

                $element.on('$destroy', function() {
                    stopAudio();
                });
            }
        }
    );
})(angular);

