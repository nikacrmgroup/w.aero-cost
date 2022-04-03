'use strict';

define([
      'underscore',
      'jquery',
      '../libs/amoSettings.js',
      '../libs/amoPrivateApi.js',
      './custom.js',
      './utils.js',
      './common/dictionary.js'],
    function(_, $, AmoSettings, AmoPrivateApi, Custom, Utils, Dictionary) {
      return function(_widget, _logger) {
        // noinspection JSPotentiallyInvalidUsageOfThis
        class Step2 {
          constructor() {
            this.product = 'None';
            this.settings = Custom.getSettings();
            this.fieldNames = Custom.getFieldNames(_widget, 'form_1', 'form_2', 'common');
            this.mappingByCode = Custom.getMapping(this.settings, this.fieldNames, 'by_code');
            this.mappingById = Custom.getMapping(this.settings, this.fieldNames, 'by_id');
            this.amoCfValues = {values: 'need to be requested'};
            this.preparedAmoCfValues = {values: 'need to be prepared'};
            this.preparedParams = {values: 'need to be prepared'};
            this.eventInSelect = false;
          }

          init = async () => {
            this.amoCfValues = await Custom.getAmoCfValues();
            this.preparedAmoCfValues = Custom.prepareAmoCfValues(this.amoCfValues);
            this.product = Custom.getProduct(this.amoCfValues, this.preparedAmoCfValues, this.mappingByCode);
            this.preparedParams = Custom.prepareParams(this.amoCfValues, this.mappingById, this.preparedAmoCfValues);
          };
          getParams = async () => {
            /*Получаем маппинг для формы 2

            * Получаем данные для этих полей из амо
            * Готовим параметры для шаблона
            * */
            await this.init();

            let params = {};
            params.commission = this.preparedParams;
            params.air_routes = await this.prepareAirRouteParams();
            params.air_routes_carriers = this.prepareAirRouteCarriersParams();
            params.auto_routes_a = await this.prepareAutoRouteParams('a');
            params.auto_routes_b = await this.prepareAutoRouteParams('b');
            params.terminal_handling_departure = await this.prepareTerminalHandlingParams('departure');
            params.terminal_handling_arrival = await this.prepareTerminalHandlingParams('arrival');
            params.common = this.preparedParams;
            const fields = Dictionary.step2productFields(this.product);

            params.tables = {
              arrival: await this.prepareTableArrivalParams(fields),
              delivery: await this.prepareTableDeliveryParams(fields),
              extra: await this.prepareTableExtraParams(fields),
              total: await this.prepareTableTotalParams(fields),
            };

            return params;
          };

          prepareTerminalHandlingParams = async function(type) {
            const param = this.preparedParams;
            let terminalHandlingArr = [];
            param[`terminal_handling_${type}`]['hidden'] = true;
            terminalHandlingArr.push(param[`terminal_handling_${type}`]);
            terminalHandlingArr.push(param[`terminal_handling_${type}_for_kg`]);
            terminalHandlingArr.push(param[`terminal_handling_${type}_for_volume`]);

            return terminalHandlingArr;
          };

          prepareAirRouteParams = async function() {
            const param = this.preparedParams;
            let airRouteArr = [];
            for (let i = 1; i < 8; i++) {
              airRouteArr.push(param[`air_route_${i}`]);
            }

            return airRouteArr;
          };
          prepareAirRouteCarriersParams = function() {
            const param = this.preparedParams;
            let airRouteCarriersArr = [];
            /*На 1 меньше, чем маршрутов, чтобы сместить по центру под низом*/

            for (let i = 1; i < 7; i++) {
              const dummy = {
                code: 'air_route_carrier_' + i,
                id: 'air_route_carrier_709469_' + i,
                name: 'Маршрут авиа перевозчик ' + i,
                type: 'text',
                value: '',
              };
              //airRouteCarriersArr.push(dummy);
              airRouteCarriersArr.push(param[`air_route_carrier_${i}`]);
            }

            return airRouteCarriersArr;
          };

          prepareAutoRouteParams = async function(type) {
            const param = this.preparedParams;
            let autoRouteArr = [];
            for (let i = 1; i < 3; i++) {
              autoRouteArr.push(param[`auto_route_${type}${i}`]);
            }
            return autoRouteArr;
          };

          prepareTableArrivalParams = async (fields) => {
            let params = {
              header: 'до пункта прилета',
              footer: 'ВСЕГО ДО ПУНКТА ПРИЛЕТА',
              tableId: 'arrival',
            };
            const rows = this.getTableRows(fields, 'arrival');
            if (rows.length > 0) {
              params.rows = rows;
              return params;
            }

            return false;
          };

          getTableRows = (fields, tableName) => {
            _logger.dev('Список продуктов получен', fields);
            if (fields === undefined) {
              return;
            }
            const fieldsCodes = fields[tableName];
            const optionFields = fields['option_fields'];
            const requiredFields = fields['required'];
            let rows = [];
            const preparedFields = this.preparedParams;
            fieldsCodes.forEach((code) => {
              const value = this.getFieldValue(code, this.preparedAmoCfValues);
              /*Проверяем, есть ли у поля значение и если нет, то относится ли оно к опциональным. Если да - то не
               показываем*/
              if (this.notEmptyOptional(optionFields, code, value) &&
                  Custom.notEmptyCustomLogic(preparedFields, code)) {
                rows.push({
                  title: this.fieldNames[code],
                  value: value,
                  code: code,
                  field: preparedFields[code],
                  dimension: this.getFieldDimension(),
                  required: requiredFields.includes(code),
                });
              }
            });
            return rows;
          };

          /**
           * Возвращает false, если поле опция и пустое
           * @param optionFields
           * @param code
           * @param value
           * @returns {boolean}
           */
          notEmptyOptional = (optionFields, code, value) => {
            let result = true;
            if (optionFields.includes(code)) {
              if ((value === 'n/a' || value === '' || value === undefined)) {
                _logger.dev(`Данное поле ${code} опционально и пустое`);
                result = false;
              }
            }

            return result;
          };
          getFieldValue = (code, cfValues) => {
            //_logger.dev(code);
            let value = 'n/a';
            try {
              const fieldId = this.mappingByCode[code].id;
              value = cfValues[fieldId];
            }
            catch (e) {
              _logger.error(e, ` code: ${code}`);
            }

            return value;
          };
          getFieldDimension = () => {
            return 'РУБ';
          };
          prepareTableDeliveryParams = async (fields) => {

            let params = {
              header: 'доставка',
              footer: 'ВСЕГО ДОСТАВКА',
              tableId: 'delivery',
              currency: 'delivery_block_currency', //выбор валюты для блока
            };
            params.rows = this.getTableRows(fields, 'delivery');
            return params;
          };
          prepareTableExtraParams = async (fields) => {
            let params = {
              header: 'дополнительные услуги',
              footer: 'ВСЕГО ДОП УСЛУГИ',
              tableId: 'extra',
              currency: 'extra_block_currency', //выбор валюты для блока
            };
            params.rows = this.getTableRows(fields, 'extra');
            return params;
          };

          changeForm = () => {
            $('#step-2-form').change(function() {
              console.log('Done some change on form');
              $('#switch-step-3').attr('data-form-changed', true);
              $('#switch-step-2').attr('data-form-changed', true);
              $('#switch-step-1').attr('data-form-changed', true);
            });
          };
          prepareTableTotalParams = async () => {
            let params = {
              footer: 'ВСЕГО',
              tableId: 'total',

            };
            return params;
          };
          /**
           * Добавляем события на элементы, кнопки шага формы
           */
          addEvents = () => {
            const $saveBtn = $('#step_2_save-button');
            $saveBtn.on('click', () => {
              if (Custom.isRequiredFilled($saveBtn)) {

                Custom.updateLeadWithBtn($saveBtn);
                $('#switch-step-3').removeAttr('data-form-changed');
                $('#switch-step-2').removeAttr('data-form-changed');
                $('#switch-step-1').removeAttr('data-form-changed');

              }
            });

            this.changeForm();
            this.changeTablesCurrency('arrival');
            this.changeTablesCurrency('delivery');
            this.changeTablesCurrency('extra');
            //this.changeTablesDimension();
            //this.changeTerminalDimension();
            this.addCalculationEvent();
          };
          /**
           * менеджер выбирает валюту РУБ или USD, эта валюта подставляется во все ячейки, за исключением
           * переопределенных в соответсвующей таблице
           *
           */
          changeTablesCurrency = (tableToModify = 'all') => {
            const ctx = this;
            let $table;
            /*Если all то по всем таблицам меняет валюту*/
            if (tableToModify === 'all') {
              $table = $('.cost-table');
            }
            else {
              const tableId = `#table-${tableToModify}`;
              $table = $(tableId);
            }

            const selector = '.cost-params .currency';
            let $currencySpans;
            /*init*/
            const initCurrency = $(`#currency-selector-${tableToModify} .control--select--list--item-selected`).text();
            /*Пишем в таблицу, какая валюта выбрана*/
            this.setTableCurrency($table, initCurrency);

            $currencySpans = $table.find(selector);
            ctx.changeCellText($currencySpans, initCurrency);

            /*Получаем выбранную валюту и пишем ее в таблицы*/
            $(`#currency-selector-${tableToModify} .control--select--list`).on('click', function(e) {
              const selectedCurrency = $(e.target).text();
              /*Пишем в таблицу, какая валюта выбрана*/
              ctx.setTableCurrency($table, selectedCurrency);
              ctx.changeCellText($currencySpans, selectedCurrency);

            });
          };
          setTableCurrency = ($table, currency) => {
            $table.attr('data-currency', currency);
            $table.find('.table-total-currency').text(currency);
          };

          /**
           * менеджер выбирает размерность кг или партия или что там в поле, и эта размерность подставляется во все
           * ячейки, за исключением
           * переопределенных
           *
           */
          changeTablesDimension = () => {
            const ctx = this;
            const triggerDimension = 'кг';
            const defaultText = '';
            const selector = '#cell-air_fare .dimension';
            /*Получаем выбранную размерность и пишем ее ячейки таблицы*/
            const $table = $('.cost-table');
            const $dimensionSpans = $table.find(selector);
            /*init*/
            const initDimension = $('#commission-dimension .control--select--list--item-selected').text();
            const normalizedDimensionString = initDimension.toLowerCase().replace(/\./g, ' ');
            if (normalizedDimensionString === triggerDimension) {
              ctx.changeCellText($dimensionSpans, `\\${initDimension}`);
            }
            /*click event*/
            $('#commission-dimension .control--select--list').on('click', function(e) {
              const selectedDimension = $(e.target).text();
              /*Проверяем, не является ли значение размерности партия - если да, то размерность не выводим*/
              /*Но делаем это хитро - считаем, что значения может быть два: кг и партия. Кг - это всегда кг и по ним
               проверяем*/
              /*"Нормализуем" килограммы - к нижнему регистру приводим и удаляем точку. Это для того, чтобы сравнить
               с эталоном*/
              const normalizedDimensionString = selectedDimension.toLowerCase().replace(/\./g, ' ');
              if (normalizedDimensionString === triggerDimension) {
                ctx.changeCellText($dimensionSpans, `\\${selectedDimension}`);
              }
              else {
                ctx.changeCellText($dimensionSpans, defaultText);
              }
            });
          };

          /**
           * Меняем текст у ячеек таблицы(и не только)
           * @param jQuerySelector Jquery объект с массивом селекторов,
           * @param text текст, который меняем
           */
          changeCellText = (jQuerySelector, text) => {
            jQuerySelector.each(function() {
              $(this).text(text);
              $(this).attr('data-selected-param', text.replace(/\\/g, ''));    //удаляем слеши
              const $parentTr = $(this).parents('tr');
              const trId = $parentTr.attr('id');

              if (['cell-terminal_handling_departure', 'cell-terminal_handling_arrival'].includes(trId)) {
                const $currencyContainers = $parentTr.find('.terminal-handling-currency');
                $currencyContainers.each(function() {
                  $(this).text(text);
                });

              }
            });
            /*Запускаем пересчет формы*/
            this.runCalculation();
          };

          addCalculationEvent = () => {
            const ctx = this;
            $('.cost-field-value, input.cost-field-value').on('keyup paste', function(e) {
              _logger.dev('run calc ...');
              ctx.runCalculation();
            });
            $('#cell-air_fare .control--select--list').on('click', function(event) {
              _logger.dev('run calc ...');
              ctx.eventInSelect = event;
              ctx.runCalculation();
            });

          };

          runCalculation = () => {

            let totalArray = [];
            const arrivalSumObj = this.calcArrival();
            const deliverySumObj = this.calcDelivery();
            const extraSumObj = this.calcExtra();

            totalArray.push(arrivalSumObj);
            totalArray.push(deliverySumObj);
            totalArray.push(extraSumObj);

            this.calcTotal(totalArray);
          };

          /**
           * Определяем валюту в таблице
           */
          getTableCurrency = (table) => {
            const currency = $(`#table-${table}`).attr('data-currency');
            return currency;
          };

          /**
           * Вычисляем ВСЕГО ДО ПУНКТА ПРИЛЕТА таблицы arrival
           */
          calcArrival = function() {
            const ctx = this;
            const tableCurrency = this.getTableCurrency('arrival');
            const $table = $('#table-arrival');

            /*!!! Устарело: Определяем размерность комиссии - кг или партия. Если кг, то получаем значение объемного
             веса в кг*/
            //const airFareDimension = $('#cell-air_fare .dimension').attr('data-selected-param');
            /*!!! Теперь так: У авиатарифа свой селект размерности, по ниму и считаем*/
            let airFareDimension = $('#cell-air_fare .dimension-selector .control--select--list--item-selected').
                text().
                trim();
            /*Проверяем, был ли ивент смены списка или начальная загрузка*/
            if (ctx.eventInSelect) {
              airFareDimension = $(ctx.eventInSelect.target).text();
            }

            let airFareValue = $('input.field_air_fare').val();
            let totalSum = 0;
            const $cells = $('.cell-value input', $table);
            $cells.each(function() {
              /*Не считаем "скрытые" поля*/
              if ($(this).hasClass('field_departure_handling_hidden')) {
                return true;
              }

              let value = $(this).val();
              value = Utils.sanitizeValue(value);
              if (value === '' || value === undefined) {
                value = 0;
              }
              /*Меняем запятую на точку*/
              // value = value.replace(',', '.');
              /*Проверяем случай, если это авиатариф*/
              if ($(this).hasClass('field_air_fare')) {
                if (airFareDimension === 'кг') {
                  let weight = $('input.field_payable_weight').val();
                  weight = Utils.sanitizeValue(weight);
                  if (weight) {
                    value = airFareValue * weight;
                  }
                }
              }
              /*Проверяем случай, если это Терминальная обработка в аэропорту*/
              if ($(this).hasClass('field_departure_handling_kg')) {
                const weight = $('input.field_payable_weight').val();
                let forKgValue = $(this).val();
                forKgValue = Utils.sanitizeValue(forKgValue);
                if (weight) {
                  value = forKgValue * weight;

                  /*Пишем в скрытый инпут "общего" поля*/
                  const $handlingParent = $(this).parents('.terminal-handling-wrapper');
                  const $hiddenInput = $handlingParent.find('.field_departure_handling_hidden');
                  const $handlingParty = $handlingParent.find('.field_departure_handling_party');
                  const partyValue = $handlingParty.val();
                  const floatValue = parseFloat(value) + parseFloat(partyValue);
                  $hiddenInput.val(Custom.formatFloat(floatValue));

                }
              }

              totalSum += parseFloat(value);
            });
            Custom.writeTotal($table, totalSum);

            return {
              sum: totalSum,
              currency: tableCurrency,
            };
          };
          /**
           * Вычисляем ВСЕГО ДОСТАВКА таблицы delivery
           */
          calcDelivery = () => {
            const tableCurrency = this.getTableCurrency('delivery');
            const $table = $('#table-delivery');
            let totalSum = 0;
            /*Определяем размерность "Терминальная обработка в аэропорту прилета" - кг или партия. Если кг, то
             получаем значение объемного веса в кг*/
            const terminalDimension = $('#cell-terminal_handling_arrival .dimension').attr('data-selected-param');
            let terminalValue = $('input.field_terminal_handling_arrival').val();

            const $cells = $('.cell-value input', $table);
            $cells.each(function() {
              /*Не считаем "скрытые" поля*/
              if ($(this).hasClass('field_arrival_handling_hidden')) {
                return true;
              }
              let value = $(this).val();
              value = Utils.sanitizeValue(value);
              if (value === '' || value === undefined) {
                value = 0;
              }
              /*Проверяем случай, если это Терминальная обработка в аэропорту*/
              if ($(this).hasClass('field_arrival_handling_kg')) {
                const weight = $('input.field_payable_weight').val();
                let forKgValue = $(this).val();
                forKgValue = Utils.sanitizeValue(forKgValue);
                if (weight) {
                  value = forKgValue * weight;
                  /*Пишем в скрытый инпут "общего" поля*/
                  const $handlingParent = $(this).parents('.terminal-handling-wrapper');
                  const $hiddenInput = $handlingParent.find('.field_arrival_handling_hidden');
                  const $handlingParty = $handlingParent.find('.field_arrival_handling_party');
                  const partyValue = $handlingParty.val();
                  const floatValue = parseFloat(value) + parseFloat(partyValue);
                  $hiddenInput.val(Custom.formatFloat(floatValue));
                }
              }
              totalSum += parseFloat(value);
            });
            Custom.writeTotal($table, totalSum);

            return {
              sum: totalSum,
              currency: tableCurrency,
            };
          };

          calcExtra = () => {
            const tableCurrency = this.getTableCurrency('extra');
            const $table = $('#table-extra');
            let totalSum = 0;
            const $cells = $('.cell-value input', $table);
            $cells.each(function() {
              let value = $(this).val();
              value = Utils.sanitizeValue(value);
              if (value === '' || value === undefined) {
                value = 0;
              }
              /*Проверяем случай, если это авиатариф*/
              totalSum += parseFloat(value);
            });
            Custom.writeTotal($table, totalSum);

            return {
              sum: totalSum,
              currency: tableCurrency,
            };
          };

          calcTotal = function(totalArray) {
            let totalSum = 0;
            const that = this;
            totalArray.forEach((table) => {
              let sum = table.sum;
              if (table.currency !== undefined && table.currency !== 'РУБ') {

                const rate = Custom.getCurrencyRate(table.currency, that.preparedParams);
                sum = sum * rate;
              }
              totalSum += sum;
            });

            const $table = $('#table-total');
            Custom.writeTotal($table, totalSum);

          };

        }

        return new Step2();

      };
    });