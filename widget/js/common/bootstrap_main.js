'use strict';

define([
      './config.js',
      './logger.js',
      './container.js',
      './context.js',
      './loader.js',
      './templater.js',
    ],
    function(ConfigClass, LoggerClass, Container, ContextClass, LoaderClass, TemplaterClass) {
      return function(_widget) {
        Container.set('widget', function() {
          return _widget;
        }),
            Container.set('config', function(c) {
              return new ConfigClass(c.getWidget());
            }),
            Container.set('logger', function(c) {
              return new LoggerClass(c.getConfig());
            }),
            Container.set('context', function(c) {
              return new ContextClass(c.getWidget());
            }),
            Container.set('loader', function(c) {
              return new LoaderClass(c.getWidget());
            }),
            Container.set('templater', function(c) {
              return new TemplaterClass(c.getWidget());
            });

      };
    });