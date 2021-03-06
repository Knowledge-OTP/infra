(function (angular) {
    'use strict';

    angular.module('znk.infra.popUp').factory('PopUpSrv', [
        '$injector', '$q', '$rootScope', '$animate', '$document',
        function ($injector, $q, $rootScope, $animate, $document) {
            var PopUpSrv = {};

            var $body = angular.element($document[0].body);
            if (!angular.element($body[0].querySelector('.znk-popup')).length) {
                var popUpsPlaceHolderElement = angular.element('<div class="znk-popup"></div>');
                $body.append(popUpsPlaceHolderElement);
            }

            var popupInstance,
                popupDefer;

            PopUpSrv.closePopup = function (reject, reason) {
                if (!reason) {
                    reason = 'closed';
                }
                popUpsPlaceHolderElement.empty();
                if (popupInstance.scope) {
                    popupInstance.scope.$destroy();
                }
                popupDefer[(reject ? 'reject' : 'resolve')](reason);
            };

            PopUpSrv.popup = function popup(wrapperCls, header, body, buttonsArr, approveCallback) {
                approveCallback = approveCallback || 0;
                //kill current popup if exists
                if (popupInstance) {
                    PopUpSrv.closePopup();
                }
                var childScope = $rootScope.$new(true);
                childScope.d = {};

                popupDefer = $q.defer();
                popupInstance = {};
                popupInstance.promise = popupDefer.promise;

                var template =
                    '<div class="%wrapperCls%">' +
                    '<div class="znk-popup-wrapper">' +
                    '<div class="znk-popup-header">%header%</div>' +
                    '<div class="znk-popup-body">%body%</div>' +
                    '<div class="znk-popup-buttons">' +
                    '<div ng-if="d.buttons && d.buttons.length" ' +
                    'ng-repeat="button in ::d.buttons" class="button-wrapper">' +
                    '<button class="btn" ' +
                    'ng-click="d.btnClick(button)" ' +
                    'ng-class="button.type" ' +
                    'ng-autofocus="button.addAutoFocus" ' +
                    'tabindex="0">' +
                    '{{button.text}}' +
                    '</button>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>';

                wrapperCls = wrapperCls ? ' ' + wrapperCls : '';
                template = template.replace('%wrapperCls%', wrapperCls);

                header = header || '';
                template = template.replace('%header%', header);

                body = body || '';
                template = template.replace('%body%', body);

                if (angular.isDefined(buttonsArr) && !angular.isArray(buttonsArr) ) {
                    buttonsArr = [buttonsArr];
                }
                childScope.d.buttons = buttonsArr;
                childScope.d.btnClick = function (button) {
                    if (button.hasOwnProperty('rejectVal')) {
                        if (approveCallback) {
                            approveCallback();
                        }
                        childScope.d.close(button.rejectVal, true);
                    } else {
                        childScope.d.close(button.resolveVal);
                    }
                };

                childScope.d.close = function (reason, reject) {
                    var animationLeaveProm = $animate.leave($template);
                    animationLeaveProm.then(function () {
                        if (childScope) {
                            childScope.$destroy();
                            childScope = null;
                        }
                        popupInstance = null;
                        if (angular.isDefined(popupDefer) && popupDefer !== null) {
                            var action = reject ? 'reject' : 'resolve';
                            reason = reason || 'close';
                            if (popupDefer[action]) {
                                popupDefer[action](reason);  // todo - for some reason this function(reason) never executed.
                                if (angular.isFunction(reason)) { //this works good.
                                    reason();
                                }

                            }
                            popupDefer = null;
                        }
                    });
                };

                var $template = angular.element(template);
                $animate.enter($template, popUpsPlaceHolderElement);
                //was added because injecting $compile dependency causing circular dependency
                var $compile = $injector.get('$compile');
                $compile(popUpsPlaceHolderElement.contents())(childScope);

                return popupInstance;
            };

            function basePopup(wrapperCls, headerIcon, title, content, btnArr, approveCallback) {
                approveCallback = approveCallback || 0;
                wrapperCls = wrapperCls ? wrapperCls + ' base-popup show-hide-animation' : 'base-popup show-hide-animation';

                headerIcon = headerIcon || '';
                var header = '<div class="icon-wrapper"><svg-icon name="%headerIcon%"></svg-icon></div>';
                header = header.replace('%headerIcon%', headerIcon);

                var body = '<div class="title responsive-title">%title%</div><div class="content">%content%</div>';
                title = title || '';
                body = body.replace('%title%', title);
                content = content || '';
                body = body.replace('%content%', content);

                return PopUpSrv.popup(wrapperCls, header, body, btnArr, approveCallback);
            }

            function BaseButton(text, type, resolveVal, rejectVal, addAutoFocus) {
                var btn = {
                    text: text || '',
                    type: type || '',
                    addAutoFocus: addAutoFocus
                };

                if (rejectVal) {
                    btn.rejectVal = rejectVal;
                } else {
                    btn.resolveVal = resolveVal;
                }

                return btn;
            }

            PopUpSrv.basePopup = basePopup;

            PopUpSrv.error = function error(title, content) {
                var btn = new BaseButton('OK', null, 'ok', undefined, true);
                return basePopup('error-popup', 'popup-exclamation-mark', title || 'OOOPS...', content, [btn]);
            };

            PopUpSrv.ErrorConfirmation = function error(title, content, acceptBtnTitle, cancelBtnTitle) {
                var buttons = [
                    new BaseButton(cancelBtnTitle, null, undefined, cancelBtnTitle, true),
                    new BaseButton(acceptBtnTitle, 'btn-outline', acceptBtnTitle)
                ];
                return basePopup('error-popup', 'popup-exclamation-mark', title, content, buttons);
            };

            PopUpSrv.success = function success(title, content) {
                var btn = new BaseButton('OK', null, 'ok', undefined, true);
                return basePopup('success-popup', 'popup-correct', title || '', content, [btn]);
            };

            PopUpSrv.info = function info(title, content) {
                var btn = new BaseButton('OK', null, 'ok', undefined, true);
                return basePopup('popup-info', 'popup-info-icon', title || '', content, [btn]);
            };

            PopUpSrv.warning = function warning(title, content, acceptBtnTitle, cancelBtnTitle, approveCallback) {
                approveCallback = approveCallback || 0;
                var buttons = [
                    new BaseButton(cancelBtnTitle, null, undefined, cancelBtnTitle, true),
                    new BaseButton(acceptBtnTitle, 'btn-outline', acceptBtnTitle)
                ];
                return basePopup('warning-popup', 'popup-exclamation-mark', title, content, buttons, approveCallback);
            };

            PopUpSrv.wait = function warning(title, content, acceptBtnTitle, cancelBtnTitle) {
                var buttons = [];
                if (acceptBtnTitle) {
                    buttons.push(new BaseButton(acceptBtnTitle, 'btn-outline', acceptBtnTitle));
                }
                if (cancelBtnTitle) {
                    buttons.push(new BaseButton(cancelBtnTitle, null, undefined, cancelBtnTitle));
                }
                return basePopup('warning-popup', 'popup-exclamation-mark', title, content, buttons);
            };

            PopUpSrv.isPopupOpen = function () {
                return !!popupInstance;
            };

            return PopUpSrv;
        }
    ]);
})(angular);
