'use strict';

define(['json!../../manifest.json', 'underscore'], function(manifest, _) {
  return function(widget) {
    return {
      debug: false,
      widget: {
        ver: manifest.widget.version,
        code: widget.params.widget_code,
      },

    };
  };

});