'use strict';

define([], function() {
  return function(widget) {
    class Loader {
      constructor() {
        this.settings = widget.get_settings();
      }

      css = styleName => {
        //   Проверяем подключен ли наш файл css
        const styleHref = `${this.settings.path}/css/${styleName}?v=${this.settings.version}`;
        const styleQuery = `link[href="${styleHref}"`;
        const styleLink = document.querySelector(styleQuery);
        if (styleLink === null) {
          const newLink = document.createRange().createContextualFragment(
              `<link href="${styleHref}" type="text/css" rel="stylesheet">`);
          const head = document.querySelector('head');
          head.appendChild(newLink);
        }
      };

    }

    //TODO singleton
    return new Loader();
  };
});