'use strict';
define(
    ['jquery', './js/common/container.js', './js/bootstrap.js'],
    function($, Container, bootstrap) {
      let CustomWidget = function() {

        const self = this;
        bootstrap(self);
        this.callbacks = {
          render: function() {
            Container.getLoader().css('style.min.css');
            if (Container.getCaption().isLeadCard()) {
              self.render_template({
                caption: {class_name: 'aero-cost-caption'},
                body: '',
                render: '',
              });
            }
            return true;
          },
          init: function() {

            Container.getCaption().addCaption();

            return true;

          },
          bind_actions: function() {
            return true;
          },
          settings: function settings($modal_body) {
            Container.getSettings($modal_body).render();
            return true;
          },
          advancedSettings: function() {

            return true;
          },
          onSave: function(params) {
            Container.getSettings().save();
            return true;
          },
          destroy: function() {

          },
          contacts: {
            //select contacts in list and clicked on widget name
            selected: function() {

            },
          },
          leads: {
            //select leads in list and clicked on widget name
            selected: function() {

            },
          },
          tasks: {
            //select taks in list and clicked on widget name
            selected: function() {

            },
          },

        };
        return this;
      };
      return CustomWidget;
    });