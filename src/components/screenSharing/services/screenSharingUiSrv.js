(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').provider('ScreenSharingUiSrv',function(){
        var screenSharingViewerTemplate;
        this.setScreenSharingViewerTemplate = function(template){
            screenSharingViewerTemplate = template;
        };

        this.$get = function ($rootScope, $timeout, $compile, $animate, PopUpSrv, $translate, $q, $log) {
            'ngInject';

            var childScope, screenSharingPhElement, readyProm;
            var ScreenSharingUiSrv = {};

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

                var defer = $q.defer();

                readyProm.then(function(){
                    childScope = $rootScope.$new(true);
                    childScope.d = {
                        userSharingState: userSharingState,
                        onClose: function(){
                            defer.resolve('closed');
                        }
                    };

                    // var screenSharingHtmlTemplate =
                    //     '<div class="show-hide-animation">' +
                    //     '<screen-sharing user-sharing-state="d.userSharingState" ' +
                    //     'on-close="d.onClose()">' +
                    //     '</screen-sharing>' +
                    //     '</div>';
                    // var screenSharingElement = angular.element(screenSharingHtmlTemplate);
                    // screenSharingPhElement.append(screenSharingElement);
                    // $animate.enter(screenSharingElement[0], screenSharingPhElement[0]);
                    // $compile(screenSharingElement)(childScope);
                });

                return defer.promise;
            }

            ScreenSharingUiSrv.activateScreenSharing = function (userSharingState) {
                return _activateScreenSharing(userSharingState);
            };

            ScreenSharingUiSrv.endScreenSharing = function () {
                _endScreenSharing();
            };

            ScreenSharingUiSrv.showScreenSharingConfirmationPopUp = function(){
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

            ScreenSharingUiSrv.__getScreenSharingViewerTemplate = function(){
                if(!screenSharingViewerTemplate){
                    $log.error('ScreenSharingUiSrv: viewer template was not set');
                    return null;
                }

                return screenSharingViewerTemplate;
            };
            //was wrapped with timeout since angular will compile the dom after this service initialization
            readyProm = $timeout(function(){
                _init();
            });

            return ScreenSharingUiSrv;
        };
    });
})(angular);
