(function (angular) {
    'use strict';

    angular.module('znk.infra.popUp', ['znk.infra.svgIcon', 'znk.infra.autofocus'])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    'popup-exclamation-mark': 'components/popUp/svg/exclamation-mark-icon.svg',
                    'popup-correct': 'components/popUp/svg/correct-icon.svg',
                    'popup-info-icon': 'components/popUp/svg/info-message-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }]);
})(angular);

'use strict';

(function () {
    angular.module('znk.infra.popUp').factory('PopUpSrv',[
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

            PopUpSrv.closePopup = function(reject,reason){
                if(!reason){
                    reason = 'closed';
                }
                popUpsPlaceHolderElement.empty();
                if (popupInstance.scope) {
                    popupInstance.scope.$destroy();
                }
                popupDefer[(reject ? 'reject' : 'resolve')](reason);
            };

            PopUpSrv.popup = function popup(wrapperCls,header,body,buttonsArr){
                //kill current popup if exists
                if(popupInstance){
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
                                '<div ng-if="::d.buttons && ::d.buttons.length" ' +
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
                template = template.replace('%wrapperCls%',wrapperCls);

                header = header || '';
                template = template.replace('%header%',header);

                body = body || '';
                template = template.replace('%body%',body);

                if(angular.isDefined(buttonsArr) && !angular.isArray(buttonsArr)){
                    buttonsArr = [buttonsArr];
                }
                childScope.d.buttons = buttonsArr;
                childScope.d.btnClick = function(button){
                    if(button.hasOwnProperty('rejectVal')){
                        childScope.d.close(button.rejectVal,true);
                    }else{
                        childScope.d.close(button.resolveVal);
                    }
                };

                childScope.d.close = function(reason,reject){
                    var animationLeaveProm = $animate.leave($template);
                    animationLeaveProm.then(function(){
                        if(childScope){
                            childScope.$destroy();
                            childScope = null;
                        }
                        popupInstance = null;
                        if (angular.isDefined(popupDefer) && popupDefer !== null) {
                            var action = reject ? 'reject' : 'resolve';
                            reason = reason || 'close';
                            if(popupDefer[action]){
                                popupDefer[action](reason);  // todo - for some reason this function(reason) never executed.
                                if(angular.isFunction(reason)){ //this works good.
                                    reason();
                                }

                            }
                            popupDefer = null;
                        }
                    });
                };

                var $template = angular.element(template);
                $animate.enter($template,popUpsPlaceHolderElement);
                //was added because injecting $compile dependency causing circular dependency
                var $compile = $injector.get('$compile');
                $compile(popUpsPlaceHolderElement.contents())(childScope);

                return popupInstance;
            };

            function basePopup(wrapperCls,headerIcon,title,content,btnArr){
                wrapperCls = wrapperCls ? wrapperCls + ' base-popup show-hide-animation' : 'base-popup show-hide-animation';

                headerIcon = headerIcon || '';
                var header = '<div class="icon-wrapper"><svg-icon name="%headerIcon%"></svg-icon></div>';
                header = header.replace('%headerIcon%',headerIcon);

                var body = '<div class="title responsive-title">%title%</div><div class="content">%content%</div>';
                title = title || '';
                body = body.replace('%title%',title);
                content = content || '';
                body = body.replace('%content%',content);

                return PopUpSrv.popup(wrapperCls,header,body,btnArr);
            }

            function BaseButton(text,type,resolveVal,rejectVal, addAutoFocus){
                var btn = {
                    text: text || '',
                    type: type || '',
                    addAutoFocus: addAutoFocus
                };

                if(rejectVal){
                    btn.rejectVal = rejectVal;
                }else{
                    btn.resolveVal = resolveVal;
                }

                return btn;
            }

            PopUpSrv.basePopup = basePopup;

            PopUpSrv.error = function error(title,content){
                var btn = new BaseButton('OK',null,'ok', undefined, true);
                return basePopup('error-popup','popup-exclamation-mark',title || 'OOOPS...',content,[btn]);
            };

            PopUpSrv.ErrorConfirmation = function error(title, content, acceptBtnTitle,cancelBtnTitle){
                var buttons = [
                    new BaseButton(acceptBtnTitle,null,acceptBtnTitle),
                    new BaseButton(cancelBtnTitle,'btn-outline',undefined,cancelBtnTitle, true)
                ];
                return basePopup('error-popup','popup-exclamation-mark',title,content,buttons);
            };

            PopUpSrv.success = function success(title,content){
                var btn = new BaseButton('OK',null,'ok', undefined, true);
                return basePopup('success-popup','popup-correct',title || '',content,[btn]);
            };

            PopUpSrv.info = function info(title,content){
                var btn = new BaseButton('OK',null,'ok', undefined, true);
                return basePopup('popup-info','popup-info-icon',title || '',content,[btn]);
            };

            PopUpSrv.warning = function warning(title,content,acceptBtnTitle,cancelBtnTitle){
                var buttons = [
                    new BaseButton(acceptBtnTitle,null,acceptBtnTitle),
                    new BaseButton(cancelBtnTitle,'btn-outline',undefined,cancelBtnTitle, true)
                ];
                return basePopup('warning-popup','popup-exclamation-mark',title,content,buttons);
            };

            PopUpSrv.wait = function warning(title,content){
                return basePopup('warning-popup','popup-exclamation-mark',title,content);
            };

            PopUpSrv.isPopupOpen = function(){
                return !!popupInstance;
            };

            return PopUpSrv;
        }
    ]);
})();

angular.module('znk.infra.popUp').run(['$templateCache', function ($templateCache) {
  $templateCache.put("components/popUp/svg/correct-icon.svg",
    "<svg version=\"1.1\"\n" +
    "     class=\"correct-icon-svg\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"0 0 188.5 129\">\n" +
    "<style type=\"text/css\">\n" +
    "	.correct-icon-svg .st0 {\n" +
    "        fill: none;\n" +
    "        stroke: #231F20;\n" +
    "        stroke-width: 15;\n" +
    "        stroke-linecap: round;\n" +
    "        stroke-linejoin: round;\n" +
    "        stroke-miterlimit: 10;\n" +
    "    }\n" +
    "</style>\n" +
    "<g>\n" +
    "	<line class=\"st0\" x1=\"7.5\" y1=\"62\" x2=\"67\" y2=\"121.5\"/>\n" +
    "	<line class=\"st0\" x1=\"67\" y1=\"121.5\" x2=\"181\" y2=\"7.5\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/popUp/svg/exclamation-mark-icon.svg",
    "<svg version=\"1.1\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-556.8 363.3 50.8 197.2\"\n" +
    "     style=\"enable-background:new -556.8 363.3 50.8 197.2;\"\n" +
    "     xml:space=\"preserve\">\n" +
    "<style type=\"text/css\">\n" +
    "	.exclamation-mark-icon .st0 {\n" +
    "        fill: none;\n" +
    "        enable-background: new;\n" +
    "    }\n" +
    "</style>\n" +
    "<g>\n" +
    "	<path d=\"M-505.9,401.6c-0.4,19.5-5.2,38.2-8.7,57.1c-2.8,15.5-4.7,31.2-6.7,46.8c-0.3,2.6-1.1,4-3.7,4.3c-1.5,0.2-2.9,0.6-4.4,0.7\n" +
    "		c-9.2,0.7-9.6,0.4-10.7-8.7c-3.4-29.6-8-58.9-14.6-87.9c-2.3-10.1-3.2-20.4-0.5-30.7c3.7-14.1,17.2-22.3,31.5-19.3\n" +
    "		c9.2,1.9,14.7,8.8,16.2,20.9C-506.7,390.3-506.4,396-505.9,401.6z\"/>\n" +
    "	<path d=\"M-528.9,525.7c10.9,0,16.8,5.3,16.9,15.2c0.1,11-9.3,19.7-21.4,19.6c-8.8,0-14.7-7-14.7-17.7\n" +
    "		C-548.2,530.9-542.4,525.7-528.9,525.7z\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/popUp/svg/info-message-icon.svg",
    "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-1062 567 176.2 162.6\" style=\"enable-background:new -1062 567 176.2 162.6;\" xml:space=\"preserve\"\n" +
    "     class=\"info-message-icon\">\n" +
    "<style type=\"text/css\">\n" +
    "	.info-message-icon .st0{\n" +
    "    fill:none;\n" +
    "    enable-background:new;\n" +
    "    }\n" +
    "</style>\n" +
    "<path class=\"st0\" d=\"M-454,182.8\"/>\n" +
    "<g>\n" +
    "	<path class=\"st0\" d=\"M-1020.7,697c-1.5-0.7-3-1.3-4.5-1.9c-22-8.7-36.5-29.5-36.6-53c-0.1-9.5-0.3-19.1,1.3-28.4c4.2-24.2,25.1-44.2,49.7-45.6\n" +
    "		c24.6-1.4,49.3-1.5,73.9,0c27.4,1.7,49.4,25.5,50.8,53c0.7,13.6,1.6,27.3-3.5,40.5c-8.3,21.7-28.8,37.5-52,37.1\n" +
    "		c-14.5-0.2-27.3,3.2-40,9.6c-14.8,7.5-30.2,14-45.4,20.8c-1.8,0.8-4.3,0.3-6.4,0.4c0.1-2.3-0.5-4.9,0.3-6.8\n" +
    "		C-1029.3,714.2-1025,705.8-1020.7,697z M-974.2,623.8c-6,0.1-10.8,4.9-10.8,10.8c0,5.9,4.9,10.8,10.8,10.9\n" +
    "		c6.1,0.1,11.2-5.1,11-11.2C-963.2,628.4-968.2,623.7-974.2,623.8z M-1030.2,634.6c0,6.1,4.7,10.8,10.7,10.9\n" +
    "		c5.9,0.1,10.9-4.8,11-10.7c0.1-6.1-4.8-11.1-11.1-11C-1025.6,623.8-1030.2,628.5-1030.2,634.6z M-928.8,623.8\n" +
    "		c-6,0.1-10.8,4.9-10.8,10.8c0,5.9,4.9,10.8,10.8,10.9c6.2,0.1,11-4.9,10.9-11.2C-918,628.2-922.7,623.7-928.8,623.8z\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
}]);
