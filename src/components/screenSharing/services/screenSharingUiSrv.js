(function (angular) {
    'use strict';

    var screenSharingContentHtmlTemplate =
        '<ng-switch on="d.sharingState">' +
        '<div ng-switch-when="2"></div>' +
        '<div ng-switch-when="3"></div>' +
        '</ng-switch>';

    angular.module('znk.infra.screenSharing').service('ScreenSharingUiSrv',
        function ($rootScope, $timeout, $compile, $animate) {
            'ngInject';

            var childScope, screenSharingPhElement, readyProm;

            function _init() {
                var bodyElement = angular.element(document.body);

                screenSharingPhElement = angular.element('<div class="screen-sharing-ph"></div>');

                bodyElement.append(screenSharingPhElement);
            }

            function _endScreenSharing() {
                if(childScope){
                    childScope.$destroy();
                }

                if(screenSharingPhElement){
                    $animate.leave(screenSharingPhElement.contents());
                }
            }

            function _activateScreenSharing(userSharingState) {
                _endScreenSharing();

                readyProm.then(function(){
                    childScope = $rootScope.$new(true);
                    childScope.d = {
                        userSharingState: userSharingState
                    };

                    var screenSharingElement = angular.element('<div class="show-hide-animation"><screen-sharing user-sharing-state="d.userSharingState"></screen-sharing></div>');
                    screenSharingPhElement.append(screenSharingElement);
                    $animate.enter(screenSharingElement[0], screenSharingPhElement[0]);
                    $compile(screenSharingElement)(childScope);
                });
            }

            this.activateScreenSharing = function (userSharingState) {
                _activateScreenSharing(userSharingState);
            };

            this.endScreenSharing = function () {
                _endScreenSharing();
            };

            //was wrapped with timeout since angular will compile the dom after this service initialization
            readyProm = $timeout(function(){
                _init();
            });

            this.activateScreenSharing(3);
        }
    );
})(angular);
