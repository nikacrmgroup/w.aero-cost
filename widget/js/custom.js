'use strict';

define([
      'underscore',
      'jquery',
      'moment',
      '../libs/amoSettings.js',
      '../libs/amoPrivateApi.js',
      './common/container.js',
      './utils.js',
    ],
    function(_, $, moment, AmoSettings, AmoPrivateApi, Container, Utils) {
      return {
        currencyIds: [
          {
            name: 'USD',
            id: 'R01235',
          },
          {
            name: 'EUR',
            id: 'R01239',
          }],
        logger: () => {
          return Container.getLogger();
        },
        getFieldNames: (widget, ...mappingSections) => {
          let allFields = {};
          mappingSections.forEach((section) => {
            let fields = widget.i18n('mapping')[section];
            allFields = Object.assign(allFields, fields);
          });

          return allFields;
        },
        /**
         * Проходим по настройкам, и разбиваем элемент настройки по ###, чтобы найти имя для вывода
         * @param settings настройки виджета
         * @param fieldNames имена полей
         * @param keyType тип индекса - по id или по кодовому названию поля делать массив
         * @returns {[mapping]}
         */
        getMapping: (settings, fieldNames, keyType) => {

          let mapping = [];
          settings.forEach((mappedField) => {
            if (mappedField.includes('###')) {
              let fieldArr = mappedField.split('###');
              let fieldCode = fieldArr[0];
              let fieldId = fieldArr[1];
              let arrayKey = (keyType === 'by_code') ? fieldCode : fieldId;
              if (fieldNames[fieldCode]) {
                mapping[arrayKey] = {
                  id: fieldId,
                  code: fieldCode,
                  name: fieldNames[fieldCode],
                };
              }
            }
          });
          return mapping;
        },
        getProduct: function(amoCfValues, preparedAmoCfValues, mapping) {
          const productCfId = mapping['product'].id;
          let productCf = amoCfValues[productCfId];
          if (productCf) {
            const productValue = productCf.values[0]['value'];
            this.logger().dev(`Поле продукта: ${productValue}`);
            return productValue;
          }
          this.logger().dev('Поле продукта пустое');
          return false;
        },
        getAmoCfValues: async function() {
          //TODO сделать кеширование?
          const leadId = AmoSettings.leadId();
          const response = await AmoPrivateApi.getLeadsById(leadId);
          if (response['_embedded']['items']['0']) {
            const lead = response['_embedded']['items']['0'];
            let cfs = lead.custom_fields;

            if (!_.isEmpty(cfs)) {
              //TODO проверить, если пустые поля в сделке
              let cfsPrepared = [];
              cfs.forEach((cf) => {
                cfsPrepared[cf.id] = cf;
              });
              return cfsPrepared;
            }
          }
          else {
            this.logger().error();
          }

          return false;
        },
        /**
         * По списку доступных enum элементов а также по имени value(оно в виде текста), находим id enum
         * @param items элементы списка
         * @param option значение элемента списка сохраненное в поле
         * @returns {number}
         */
        getSelectedEnum: (items, option) => {
          let id = 1;
          items.forEach((item) => {
            if (item.option === option) {
              id = item.id;
            }
          });
          return id;
        },
        /**
         * Выбранные элементы для мультичекбокса
         * @param enums
         * @param options
         * @returns {number}
         */
        getSelectedMultiEnum: (enums, options) => {
          let items = $.extend({}, enums);
          enums.forEach((enumItem, index) => {
            /*Проверяем, есть ли текущий элемент в списке(массиве) выбранных(зачеканных)*/

            if (options.includes(parseInt(enumItem.id))) {
              items[index]['is_checked'] = true;
            }
          });

          return items;
        },

        prepareParams: function(amoCfValues, mappingById, preparedAmoCfValues, disabledFields) {
          let params = [];
          let value;
          mappingById.forEach((field) => {
            if (preparedAmoCfValues[field.id]) {
              value = this.modifyCfValue(field.id, preparedAmoCfValues[field.id]);
            }
            else {
              /*Если поле пустое, то его надо отдельно "готовить"*/
              value = '';
            }
            const fieldType = AmoSettings.getCfType(field.id);
            if (!fieldType) {
              return;
            }
            params[field.code] =
                {
                  id: field.id,
                  value: value,
                  name: field.name,
                  type: fieldType,
                  code: field.code,
                };
            /*Проверяем, не select ли поле. Если да, то нам нужны items*/
            if (['select'].includes(fieldType)) {
              const items = AmoSettings.getSelectCfItems(field.id);
              params[field.code]['items'] = items;
              params[field.code]['selected'] = this.getSelectedEnum(items, value);
            }
            if (['multiselect'].includes(fieldType)) {
              const items = AmoSettings.getMultiSelectCfItems(field.id);
              params[field.code]['items'] = this.getSelectedMultiEnum(items, value);

            }
            /*Проверяем, не поле ли это с пользователем, который заполнял калькулятор. Если да, то делаем поле
             disabled*/
            if (field.code === 'calc_performed') {
              params[field.code].disabled = true;
              params[field.code].value = AmoSettings.userName();
            }
            if (field.code === 'payable_weight') {
              params[field.code].disabled = false;
            }
            /*Плотность груза из калькулятора*/
            if (field.code === 'cargo_density') {
              params[field.code].disabled = true;
            }
            /*Если это последня форма, то делаем поле disabled*/
            if (disabledFields) {
              params[field.code].disabled = true;
            }
            /*Добавляем обязательность полям*/
            if (['delivery_period'].includes(field.code)) {
              //params[field.code].required = true;
            }
          });

          return params;
        },
        /**
         * Меняем значение поля для вывода. Например, если это флаг
         * то амо возвращает 1,  нам надо "да"
         * @param id
         * @param rawValue
         */
        modifyCfValue: (id, rawValue) => {
          const cfType = AmoSettings.getCfType(id);
          let value;

          switch (cfType) {
            case 'checkbox':
              if (rawValue === '1') {
                value = 'Да';
              }
              break;
            case 'multiselect':
              value = rawValue;
              break;
            case 'date':
              value = moment(rawValue).format('DD.MM.YYYY');
              break;
            default:
              value = rawValue;
          }
          return value;

        },
        prepareAmoCfValues: (amoCfValues) => {
          let preparedData = [];
          if (!_.isEmpty(amoCfValues)) {
            amoCfValues.forEach((cf) => {
              //проверка на тип поля, если enum  то  количество значений будет больше 1
              const cfType = AmoSettings.getCfType(cf.id);
              if (cfType === 'multiselect') {

                if (!Array.isArray(preparedData[cf.id])) {
                  preparedData[cf.id] = [];
                }
                const enums = cf.values;
                enums.forEach((item) => {
                  preparedData[cf.id].push(item.enum);
                });
              }
              else {
                preparedData[cf.id] = cf.values[0]['value'];
              }

            });
          }

          return preparedData;
        },

        updateLeadWithBtn: function(btn) {
          btn.trigger('button:load:start');
          const leadId = AmoSettings.leadId();
          const formFieldsValues = this.getFormFieldsValues(btn);
          const preparedForAmoCfValues = this.prepareFieldsApiParams(formFieldsValues);

          AmoPrivateApi.updateLeadFieldV4(leadId, preparedForAmoCfValues, (response) => {
            this.logger().dev(JSON.stringify(response, null, 4));
            btn.trigger('button:load:stop');
          }, (error) => {this.logger().dev('error: ' + JSON.stringify(error, null, 4));});
        },

        /**
         * Обновляем сделку через массив полей и их новых значений
         * @param fieldsParams
         */
        updateLeadFields: function(fieldsValues = []) {

          const leadId = AmoSettings.leadId();
          if (fieldsValues) {
            const preparedForAmoCfValues = this.prepareFieldsApiParams(fieldsValues);
            AmoPrivateApi.updateLeadFieldV4(leadId, preparedForAmoCfValues, (response) => {
              this.logger().dev(JSON.stringify(response, null, 4));
            }, (error) => {this.logger().dev('error: ' + JSON.stringify(error, null, 4));});
          }

        },

        isRequiredFilled: function($btn) {
          let allFilled = true;
          const $form = $btn.parents('form');
          const $inputs = $form.find('input');
          $inputs.each(function() {
            let input = $(this);
            input.removeClass('required-input');
            if (input.prop('required') && input.val() === '') {
              input.addClass('required-input');
              input.prop('placeholder', 'Заполните поле');
              allFilled = false;
            }
          });

          const $allTextarea = $form.find('textarea');
          $allTextarea.each(function() {
            let $textarea = $(this);
            $textarea.removeClass('required-input');
            if ($textarea.hasClass('aero-field-required') && $textarea.val() === '') {
              $textarea.addClass('required-input');
              $textarea.prop('placeholder', 'Заполните поле');
              allFilled = false;
            }
          });

          const $allCheckboxDropdown = $form.find('.checkboxes_dropdown');
          $allCheckboxDropdown.each(function() {
            let $checkboxDropdown = $(this);
            $checkboxDropdown.removeClass('required-input');
            /*Проверяем, есть ли заполненный чекбокс*/

            const $checkedCheckboxes = $checkboxDropdown.find('.js-item-checkbox:checked');

            if ($checkboxDropdown.hasClass('aero-field-required') && $checkedCheckboxes.length === 0) {
              $checkboxDropdown.addClass('required-input');
              $checkboxDropdown.prop('placeholder', 'Заполните поле');
              allFilled = false;
            }
          });

          return allFilled;
        },

        /**
         * Собираем поля с формы
         * @param btn Jquery объект нажатой кнопки
         * @returns {[{number: string}]} Ключ - это id поля в амо, значение - содержимое поля, которое нужно
         * записать в в амо
         *
         */
        getFormFieldsValues: function(btn) {
          const parentWrapper = '.step-content';
          let fields = [];
          const $form = btn.parents(parentWrapper).find('form');
          const fieldsObj = Utils.getFormData($form);

          if (fieldsObj) {
            /*name должен быть step-input-айди*/
            const data = Object.entries(fieldsObj);
            data.forEach((element) => {
              let elementArray = element[0].split('-');
              let value = element[1];
              let id = elementArray[2];

              fields.push({
                id: id,
                value: value,
              });
            });
          }
          return fields;
        },

        alterFormValues: function(id, value, mappingId) {
          let alteredValue = value;
          const code = mappingId[id].code;
          if (code === 'air_route') {

          }

          return alteredValue;
        },

        getCurrencyRate: function(sellCurrency = 'USD', params) {
          //TODO сделать кеширование запроса
          //
          let currencyId, rate, customRate;
          this.currencyIds.forEach((currency) => {
            if (currency.name === sellCurrency) {
              currencyId = currency.id;
            }
          });
          /*Если стоит флаг в сделке, мол свой курс, то его и используем из соответствущего поля*/
          const customRateNeed = params['custom_currency_rate_need'];

          if (customRateNeed.value === 'Да') {
            customRate = params[`custom_currency_rate_${sellCurrency}`].value;
            if (customRate) {
              rate = parseFloat(customRate);
            }
          }
          else {
            if (currencyId) {
              const leadId = AmoSettings.leadId();
              let cachedRates = Utils.getCache(`aero-cost-currency-all_${leadId}`);
              if (cachedRates) {
                cachedRates.forEach((cacheRate) => {
                  if (cacheRate.id === currencyId) {
                    rate = parseFloat(cacheRate.rate);
                  }
                });
              }
            }
            else {
              rate = 1; ///Это на случай всяких валют и прочего
              this.logger().dev('Валюта не опознана для ', sellCurrency);
            }
          }

          return rate;

        },
        getAllCurrencyRates: async function(ids = [{}]) {
          //TODO сделать кеширование запроса

          const rate = await this.cbrRequestAll(ids);

          return rate;

        },
        cbrRequestAll: async function(ids = []) {
          const widget = Container.getContext().widget;
          const date = moment().format('DD/MM/YYYY');
          const requestUrl = 'https://www.cbr.ru/scripts/XML_daily.asp?date_req=' + date;
          const promise = new Promise(async function(fulfilled, rejected) {
            widget.crm_post(
                requestUrl,
                {},
                await function(xml) {
                  const $xml = $(xml);
                  const rates = [];
                  ids.forEach((currency) => {
                    const rate = parseFloat(
                        $xml.find(`Valute[ID="${currency.id}"] Value`).text().replace(',', '.'));
                    currency['rate'] = rate;
                    rates.push(currency);
                  });
                  const leadId = AmoSettings.leadId();
                  Utils.setCache(`aero-cost-currency-all_${leadId}`, rates, 1000);
                  fulfilled(rates);
                },
                'xml',
                function(error) {
                  console.error(error);
                },
            );
          });
          const result = await promise.then(result => { return result;});
          return result;
        },
        notEmptyCustomLogic: (preparedFields, code) => {
          let result = true;

          if (preparedFields['danger_declaration_need'].value === '' &&
              ['danger_declaration', 'danger_marking'].includes(code)) {
            result = false;
          }
          /*страхованию */
          if (preparedFields['insurance_need'].value === '' && ['insurance'].includes(code)) {
            result = false;
          }


          /*и таможенному оформлению Импорт*/
          if (preparedFields['import_TO_need'].value === '' && ['import_TO'].includes(code)) {
            result = false;
          }
          /*и таможенному оформлению Экспорт*/
          if (preparedFields['export_TO_need'].value === '' && ['export_TO'].includes(code)) {

            result = false;
          }
          /*упаковка появляется в допуслугах только если в поле выбрано "Требуется упаковка" . Требуется – это часть списка, и если выбрано то выводим поле для ввода стоимости упаковки, а не список.*/
          if (preparedFields['packaging_need'].value !== 'Требуется упаковка' && ['packaging'].includes(code)) {
            result = false;
          }
          /*Экспедирование в пункте отправления флаг и если да, то в шаге 2 в группе
           полей "До пункта прилета" должна быть "Автодоставка от отправителя" , иначе не выводим */
          if (preparedFields['forwarding_departure_need'].value !== 'Да' &&
              'auto_delivery_sender' === code) {

            result = false;
          }
          /*Экспедирование в пункте назанчения флаг и если да, то в шаге 2 в группе
         полей "Доставка" должна быть "Автодоставка до получателя", иначе не выводим */
          if (preparedFields['forwarding_destination_need'].value !== 'Да' &&
              'auto_delivery_recipient' === code) {
            result = false;
          }

          return result;
        },
        /**
         * Проверяем, не является ли поле динамически выведенной заглушкой
         * @param id
         * @returns {boolean}
         */
        isNotDummyField: (id) => {
          let result = true;
          const dummyIds = ['air_route_carrier'];

          dummyIds.forEach(function(dummyId) {
            if (id.includes(dummyId)) {
              result = false;
            }
          });

          return result;
        },
        /**
         * Проходим по полученным с формы значениям полей и по каждому определяем его тип и структуру запроса
         * @param formFields
         */
        prepareFieldsApiParams: function(formFields) {
          let data = [];
          const self = this;
          /*const checkIsEmpty =*/
          formFields.forEach((field) => {
            if (self.isNotDummyField(field.id)) {
              const fieldType = AmoSettings.getCfType(field.id);
              const fieldStructure = AmoSettings.getFieldDataStructure(fieldType, field.id, field.value);
              if (fieldStructure !== false) {
                data.push(fieldStructure);
              }
            }
          });
          return data;
        },
        writeTotal: function($table, totalSum) {

          let totalSumToTable = this.formatFloat(totalSum);
          if (Number.isNaN(totalSum)) {
            totalSumToTable = 'Ошибка в заполнении';
          }
          $('.table-total-value .show-amount', $table).text(totalSumToTable);
          $('.table-total-value input', $table).val(totalSumToTable).hide();

        },
        formatFloat: (number) => {
          return parseFloat(number).toFixed(2);
        },
        prepareCalcValue: (value) => {
          if (value.isNaN || value === '') {
            value = 0;
          }
          return value;
        },
        getSettings: () => {
          const settings = Container.getContext().widget.params['storage'];
          return settings ?? [];
        },
      };
    });