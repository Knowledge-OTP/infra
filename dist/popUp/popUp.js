(function (angular) {
    'use strict';

    angular.module('znk.infra.popUp', ['znk.infra.svgIcon', 'znk.infra.autofocus'])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    'exclamation-mark': 'components/popUp/svg/exclamation-mark-icon.svg',
                    'correct': 'components/popUp/svg/correct-icon.svg'
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
            var popUpsPlaceHolderElement = angular.element('<div class="znk-popup"></div>');
            $body.append(popUpsPlaceHolderElement);

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
                                '<div ng-repeat="button in ::d.buttons" class="button-wrapper">' +
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
                                popupDefer[action](reason);
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

            PopUpSrv.error = function error(title,content){
                var btn = new BaseButton('OK',null,'ok', undefined, true);
                return basePopup('error-popup','exclamation-mark',title || 'OOOPS...',content,[btn]);
            };

            PopUpSrv.ErrorConfirmation = function error(title, content, acceptBtnTitle,cancelBtnTitle){
                var buttons = [
                    new BaseButton(acceptBtnTitle,null,acceptBtnTitle),
                    new BaseButton(cancelBtnTitle,'btn-outline',undefined,cancelBtnTitle, true)
                ];
                return basePopup('error-popup','exclamation-mark',title,content,buttons);
            };

            PopUpSrv.success = function success(title,content){
                var btn = new BaseButton('OK',null,'ok', undefined, true);
                return basePopup('success-popup','correct',title || '',content,[btn]);
            };

            PopUpSrv.warning = function warning(title,content,acceptBtnTitle,cancelBtnTitle){
                var buttons = [
                    new BaseButton(acceptBtnTitle,null,acceptBtnTitle),
                    new BaseButton(cancelBtnTitle,'btn-outline',undefined,cancelBtnTitle, true)
                ];
                return basePopup('warning-popup','exclamation-mark',title,content,buttons);
            };

            PopUpSrv.isPopupOpen = function(){
                return !!popupInstance;
            };

            return PopUpSrv;
        }
    ]);
})();

angular.module('znk.infra.popUp').run(['$templateCache', function($templateCache) {
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
    "     id=\"Layer_1\"\n" +
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
}]);
