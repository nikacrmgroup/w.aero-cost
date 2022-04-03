'use strict';

define([], function() {
  return function(Config) {
    class Logger {
      constructor() {
        this.widgetSignature = `[${Config.widget.ver}] `;
        this.show('Виджет запущен');

      }

      styleThis = (background, color) => {
        return [
          `background: ${background} `,
          'border-radius: 2px',
          `color: ${color}`,
          'font-size: 11px',
          'font-weight: bold',
          'padding: 2px 3px',
        ].join(';');
      };
      /*Еще вариант
      * https://dev.to/maxbvrn/extend-console-s-methods-without-losing-line-information-2d68
      * */
      showLog = console.log.bind(console, '%c %s', this.styleThis('darkgreen', 'white'));
      showDev = console.info.bind(console, '%c %s', this.styleThis('orange', 'black'));
      showError = console.error.bind(console, '%c %s', this.styleThis('red', 'black'));

      //TODO сделать таймер операций
      show(message, ...args) {
        this.showLog(`🐱${this.widgetSignature}${message}`, ...args);
      };

      error(message, ...args) {
        this.showError(`💥${this.widgetSignature}${message}`, ...args);
      };

      dev(message, ...args) {
        if (Config.debug) {
          this.showDev(`🚧${this.widgetSignature}${message}`, ...args);
        }
      };

    }

    return new Logger;
  };

});
