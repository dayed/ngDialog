/*
 * ngDialog - easy modals and popup windows
 * http://github.com/likeastore/ngDialog
 * (c) 2013 MIT License, https://likeastore.com
 */

(function (window, angular, undefined) {
	'use strict';

	var module = angular.module('ngDialog', []);

	var $el = angular.element;
	var isDef = angular.isDefined;
	var style = (document.body || document.documentElement).style;
	var animationEndSupport = isDef(style.animation) || isDef(style.WebkitAnimation) || isDef(style.MozAnimation) || isDef(style.MsAnimation) || isDef(style.OAnimation);
	var animationEndEvent = 'animationend webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend';

	module.provider('ngDialog', function () {
		var globalID = this.globalID = 0;

		var defaults = this.defaults = {
			className: 'ngdialog-theme-default',
			plain: false,
			showClose: true,
			closeByDocument: true,
			closeByEscape: true
		};

		this.$get = ['$document', '$templateCache', '$compile', '$q', '$http', '$rootScope', '$timeout',
			function ($document, $templateCache, $compile, $q, $http, $rootScope, $timeout) {
				var $body = $document.find('body');

				var privateMethods = {
					closeDialog: function ($dialog, next) {
						$dialog.unbind('click');

						if (!next) {
							$body.unbind('keyup').removeClass('ngdialog-open');
						}

						if (animationEndSupport) {
							$dialog.unbind(animationEndEvent).bind(animationEndEvent, function () {
								$dialog.remove();
							}).addClass('ngdialog-closing');
						} else {
							$dialog.remove();
						}
					}
				};

				var publicMethods = {

					/*
					 * @param {Object} options:
					 * - template {String} - id of ng-template, url for partial, plain string (if enabled)
					 * - plain {Boolean} - enable plain string templates, default false
					 * - scope {Object}
					 * - controller {String}
					 * - className {String} - dialog theme class
					 * - showClose {Boolean} - show close button, default true
					 * - closeByEscape {Boolean} - default true
					 * - closeByDocument {Boolean} - default true
					 *
					 * @return {Object} dialog
					 */
					open: function (opts) {
						var options = angular.copy(defaults);

						opts = opts || {};
						angular.extend(options, opts);

						globalID += 1;

						var scope = options.scope && angular.isObject(options.scope) || $rootScope.$new();
						var $dialog;

						$q.when(loadTemplate(options.template)).then(function (template) {
							if (options.showClose) {
								template += '<div class="ngdialog-close"></div>';
							}

							$dialog = $el('<div id="ngdialog' + globalID + '" class="ngdialog"></div>');
							$dialog.html('<div class="ngdialog-overlay"></div><div class="ngdialog-content">' + template + '</div>');

							if (options.controller && angular.isString(options.controller)) {
								$dialog.attr('ng-controller', options.controller);
							}

							if (options.className) {
								$dialog.addClass(options.className);
							}

							$timeout(function () {
								$compile($dialog)(scope);
							});

							scope.$on('$destroy', function () {
								$dialog.remove();
							});

							$body.addClass('ngdialog-open').append($dialog);

							if (options.closeByEscape) {
								$body.bind('keyup', function (event) {
									if (event.keyCode === 27) {
										publicMethods.close($dialog.attr('id'));
									}
								});
							}

							if (options.closeByDocument) {
								$dialog.bind('click', function (event) {
									var isOverlay = $el(event.target).hasClass('ngdialog-overlay');
									var isCloseBtn = $el(event.target).hasClass('ngdialog-close');

									if (isOverlay || isCloseBtn) {
										publicMethods.close($dialog.attr('id'));
									}
								});
							}

							return {

							};
						});

						function loadTemplate (tmpl) {
							if (!tmpl) {
								return 'Empty template';
							}

							if (angular.isString(tmpl) && options.plain) {
								return tmpl;
							}

							return $templateCache.get(tmpl) || $http.get(tmpl, { cache: true });
						}
					},

					/*
					 * @return {Object} dialog
					 */
					close: function (id) {
						var $dialog = $el(document.getElementById(id));
						//debugger;

						if ($dialog.length) {
							privateMethods.closeDialog($dialog);
						} else {
							publicMethods.closeAll();
						}

						return publicMethods;
					},

					closeAll: function () {
						var $all = document.querySelectorAll('.ngdialog');
						angular.forEach($all, function (dialog) {
							privateMethods.closeDialog($el(dialog));
						});
					}
				};

				return publicMethods;
			}];
	});

	module.directive('ngDialog', function () {});

})(window, window.angular);
