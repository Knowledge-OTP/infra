(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').service('ScreenSharingUiSrv',
        function ($rootScope, $timeout, $compile, $animate, PopUpSrv, $translate, $q, $log) {
            'ngInject';

            var childScope, screenSharingPhElement, readyProm;
            var self = this;

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
                    var hasContents = !!screenSharingPhElement.contents().length;
                    if(hasContents){
                        $animate.leave(screenSharingPhElement.contents());
                    }
                }
            }

            function _activateScreenSharing(userSharingState) {
                _endScreenSharing();

                readyProm.then(function(){
                    childScope = $rootScope.$new(true);
                    childScope.d = {
                        userSharingState: userSharingState,
                        onClose: function(){
                            self.endScreenSharing();
                        }
                    };

                    var screenSharingHtmlTemplate =
                        '<div class="show-hide-animation">' +
                            '<screen-sharing user-sharing-state="d.userSharingState" ' +
                                            'on-close="d.onClose()">' +
                            '</screen-sharing>' +
                        '</div>';
                    var screenSharingElement = angular.element(screenSharingHtmlTemplate);
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

            this.showScreenSharingConfirmationPopUp = function(){
                var translationsPromMap = {};
                translationsPromMap.title = $translate('SCREEN_SHARING.SHARE_SCREEN_REQUEST');
                translationsPromMap.content= $translate('SCREEN_SHARING.WANT_TO_SHARE',{
                    name: "Student/Teacher"
                });
                translationsPromMap.acceptBtnTitle = $translate('SCREEN_SHARING.REJECT');
                translationsPromMap.cancelBtnTitle = $translate('SCREEN_SHARING.ACCEPT');
                return $q.all(translationsPromMap).then(function(translations){
                    var popUpInstance = PopUpSrv.warning(
                        translations.title,
                        translations.content,
                        translations.acceptBtnTitle,
                        translations.cancelBtnTitle
                    );
                    return popUpInstance.promise.then(function(res){
                        return $q.reject(res);
                    },function(res){
                        return $q.resolve(res);
                    });
                },function(err){
                    $log.error('ScreenSharingUiSrv: translate failure' + err);
                    return $q.reject(err);
                });
            };
            //was wrapped with timeout since angular will compile the dom after this service initialization
            readyProm = $timeout(function(){
                _init();
            });
        }
    );
})(angular);
