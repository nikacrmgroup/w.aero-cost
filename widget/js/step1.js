'use strict';

define(
    ['underscore', 'jquery', '../libs/amoSettings.js', '../libs/amoPrivateApi.js', './custom.js'],
    function(_, $, AmoSettings, AmoPrivateApi, Custom) {
      return function(_widget, _logger) {

        class Step1 {

          getParams = async () => {
            /*Получаем маппинг для формы 1
            * Получаем данные для этих полей из амо
            * Готовим параметры для шаблона
            * */
            const settings = Custom.getSettings();
            const fieldNames = Custom.getFieldNames(_widget, 'form_1', 'form_2', 'common');
            /*Получаем сразу два маппинга для удобства. Где-то нужен массив для итерации, тогда
            * индекс - id(by_id), а где-то по кодовому(by_code) названию поля удобнее*/
            const mappingByCode = Custom.getMapping(settings, fieldNames, 'by_code');
            const mappingById = Custom.getMapping(settings, fieldNames, 'by_id');
            const amoCfValues = await Custom.getAmoCfValues();
            if (amoCfValues) {
              const preparedAmoCfValues = Custom.prepareAmoCfValues(amoCfValues);
              let params = Custom.prepareParams(amoCfValues, mappingById, preparedAmoCfValues);
              params.product = Custom.getProduct(amoCfValues, preparedAmoCfValues, mappingByCode);
              params.title = _widget.i18n('text')['form_1_title'];
              params.version = _widget.get_settings().version;
              return params;
            }
            return false;
          };
          changeForm = () => {
            $('#step-1-form').change(function() {
              console.log('Done some change on form');
              $('#switch-step-3').attr('data-form-changed', true);
              $('#switch-step-2').attr('data-form-changed', true);
              $('#switch-step-1').attr('data-form-changed', true);
            });
          };

          /**
           * Добавляем события на элементы, кнопки шага формы
           */
          addEvents = () => {
            const $saveBtn = $('#step_1_save-button');
            $saveBtn.on('click', () => {
              Custom.updateLeadWithBtn($saveBtn);
              $('#switch-step-3').removeAttr('data-form-changed');
              $('#switch-step-2').removeAttr('data-form-changed');
              $('#switch-step-1').removeAttr('data-form-changed');
            });

            this.changeForm();

          };
        }

        return new Step1();

      };
    });