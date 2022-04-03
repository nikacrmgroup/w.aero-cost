'use strict';

define([
      './common/container.js',
      './common/bootstrap_main.js',
      './settings.js',
      './caption.js',
      './custom.js',
      './step1.js',
      './step2.js',
      './step3.js',
      './form.js',
      './utils.js'],
    function(Container, bootstrapMain, SettingsClass, CaptionClass,
        CustomClass, Step1Class, Step2Class, Step3Class, FormClass,
        WidgetUtils) {

      return function(_widget) {

        bootstrapMain(_widget);

        Container.set('widget_utils', function(c) {
          return new WidgetUtils();
        });

        Container.set('custom', function(c) {
          return new CustomClass(c.getWidget(), c.getTemplater(),
              c.getLogger());
        });
        Container.set('step1', function(c) {
          return new Step1Class(c.getWidget(), c.getLogger());
        });
        Container.set('step2', function(c) {
          return new Step2Class(c.getWidget(), c.getLogger());
        });
        Container.set('step3', function(c) {
          return new Step3Class(c.getWidget(), c.getLogger());
        });
        Container.factory('form', function(c) {
          return new FormClass(c.getWidget(), c.getLogger(), c.getTemplater(), c);
        });
        Container.factory('caption', function(c) {
          return new CaptionClass(c.getWidget(), c.getLogger(), c.getForm());
        });
        Container.factory('settings', function(c, $modal_body) {
          return new SettingsClass($modal_body, c.getWidget(),
              c.getTemplater(), c.getLogger(), c.getConfig());
        });

      };
    });