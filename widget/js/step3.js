'use strict';

define([
      'underscore',
      'jquery',
      '../libs/amoSettings.js',
      '../libs/amoPrivateApi.js',
      './custom.js',
      './generator.js',
      './utils.js',
      './common/dictionary.js'],
    function(_, $, AmoSettings, AmoPrivateApi, Custom, Generator, Utils, Dictionary) {
      return function(_widget, _logger) {
        // noinspection JSPotentiallyInvalidUsageOfThis
        class Step3 {
          constructor() {
            this.product = 'None';
            this.settings = Custom.getSettings();
            this.fieldNames = Custom.getFieldNames(_widget, 'form_1', 'form_2', 'common');
            this.mappingByCode = Custom.getMapping(this.settings, this.fieldNames, 'by_code');
            this.mappingById = Custom.getMapping(this.settings, this.fieldNames, 'by_id');
            this.amoCfValues = {values: 'need to be requested'};
            this.preparedAmoCfValues = {values: 'need to be prepared'};
            this.preparedParams = {values: 'need to be prepared'};
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
            params.commission = await this.prepareCommissionParams();
            params.common = await this.prepareCommonParams();
            const fields = Dictionary.step3productFields(this.product);

            params.tables = {
              arrival: await this.prepareTableArrivalParams(fields),
              delivery: await this.prepareTableDeliveryParams(fields),
              extra: await this.prepareTableExtraParams(fields),
              total: await this.prepareTableTotalParams(fields),
            };
            return params;
          };
          prepareCommissionParams = async function() {
            /*Готовим параметры для шаблона полей комиссии
            * Сначала поле суммы комиссии
            * Затем размерность комиссии
            * Затем валюту комиссии
            * */

            /*       const fieldNames = {
                     'commission_type': 'Тип комиссии ("За партию" или "За кг")',
                     'commission_currency': 'Валюта комиссии',
                     'commission': 'Сумма комиссии',
                   };*/

            const preparedAmoCfValues = Custom.prepareAmoCfValues(this.amoCfValues);
            return Custom.prepareParams(this.amoCfValues, this.mappingById, preparedAmoCfValues);

          };

          prepareCommonParams = async function() {
            /*
            Готовим параметры для шаблона остальных полей
            */


            const preparedAmoCfValues = Custom.prepareAmoCfValues(this.amoCfValues);
            return Custom.prepareParams(this.amoCfValues, this.mappingById, preparedAmoCfValues);

          };

          prepareTableArrivalParams = async function(fields) {
            await this.init();
            /*Добавим комиссию за вес*/
            const commissionType = this.getFieldValue('commission_type', this.preparedAmoCfValues);
            let commission = this.getFieldValue('commission', this.preparedAmoCfValues);
            if (commissionType === 'кг') {
              commission = commission * this.getFieldValue('payable_weight', this.preparedAmoCfValues);
            }
            const totalWoCommission = this.getFieldValue('total_destination', this.preparedAmoCfValues);
            const total = Custom.formatFloat(parseFloat(totalWoCommission) + parseFloat(commission));
            let params = {
              header: 'до пункта прилета',
              footer: 'ВСЕГО ДО ПУНКТА ПРИЛЕТА',
              tableId: 'arrival',
              currency: this.getTableCurrencyByField('commission_currency'),
              total: total,
            };
            const rows = this.getTableRows(fields, 'arrival');
            if (rows.length > 0) {
              params.rows = rows;
              return params;
            }

            return false;
          };

          getTableRows = function(fields, tableName) {
            const that = this;

            const fieldsCodes = fields[tableName];
            const optionFields = fields['option_fields'];
            const requiredFields = fields['required'];
            let rows = [];
            let preparedFields = Custom.prepareParams(this.amoCfValues, this.mappingById, this.preparedAmoCfValues,
                'disabledFields');
            const weight = that.getFieldValue('payable_weight', that.preparedAmoCfValues);
            fieldsCodes.forEach((code) => {
              let value = that.getFieldValue(code, this.preparedAmoCfValues);
              /*Проверяем, есть ли у поля значение и если нет, то относится ли оно к опциональным. Если да - то не
               показываем*/
              if (that.notEmptyOptional(optionFields, code, value) &&
                  Custom.notEmptyCustomLogic(preparedFields, code)) {
                /*Проверяем, не air_fare если да, то прибавляем комиссию*/
                if (code === 'air_fare') {

                  /*!!! Теперь так: У авиатарифа свое поле размерности, по ниму и считаем*/
                  let airFareValue = that.getFieldValue('air_fare', that.preparedAmoCfValues);
                  let airFareDimension = that.getFieldValue('air_fare_dimension', that.preparedAmoCfValues);
                  /*Проверяем случай, если это авиатариф*/

                  if (airFareDimension === 'кг') {
                    if (weight) {
                      value = airFareValue * weight;
                    }
                  }
                  /*Прибавляем комиссию*/
                  let commissionValue = that.getFieldValue('commission', this.preparedAmoCfValues);
                  const commissionType = that.getFieldValue('commission_type', this.preparedAmoCfValues);

                  if (commissionType === 'кг') {
                    commissionValue = commissionValue * weight;
                  }
                  value = Custom.formatFloat(parseFloat(value) + parseFloat(commissionValue));

                  //Обновляем поле авиатарифа
                  $('input.field_air_fare').val(value);
                  preparedFields[code].value = Custom.formatFloat(value);
                }
                /*Если выбран продукт HA или HD, то комиссия в КП подставляется в поле "Получение груза в аэропорту прилета"*/
                if (code === 'receiving_cargo_arrival' && ['HA', 'HD'].includes(this.product)) {
                  const commissionValue = that.getFieldValue('commission', this.preparedAmoCfValues);
                  value = parseFloat(value) + parseFloat(commissionValue);
                  preparedFields[code].value = Custom.formatFloat(value);
                }

                rows.push({
                  title: this.fieldNames[code],
                  value: value,
                  code: code,
                  field: preparedFields[code],
                  dimension: that.getFieldDimension(),
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
              currency: this.getTableCurrencyByField('delivery_block_currency'),
              total: this.getFieldValue('total_delivery', this.preparedAmoCfValues),
            };
            params.rows = this.getTableRows(fields, 'delivery');
            return params;
          };
          prepareTableExtraParams = async (fields) => {
            let params = {
              header: 'дополнительные услуги',
              footer: 'ВСЕГО ДОП УСЛУГИ',
              tableId: 'extra',
              currency: this.getTableCurrencyByField('extra_block_currency'),
              total: this.getFieldValue('total_add_services', this.preparedAmoCfValues),
            };
            params.rows = this.getTableRows(fields, 'extra');
            return params;
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

            this.changeTablesCurrency('arrival');
            this.changeTablesCurrency('delivery');
            this.changeTablesCurrency('extra');

            /*Запускаем пересчет формы*/
            this.runCalculation();

            //this.addCalculationEvent();
            this.generateMailCode();

          };
          /**
           * менеджер выбирает валюту РУБ или USD, эта валюта подставляется во все ячейки, за исключением
           * переопределенных в соответсвующей таблице
           *
           */
          changeTablesCurrency = (tableToModify = 'all') => {
            const ctx = this;
            const $step3 = $('#step-form-wrapper-3');
            let $table;
            /*Если all то по всем таблицам меняет валюту*/
            if (tableToModify === 'all') {
              $table = $('.cost-table');
            }
            else {
              const tableId = `#table-${tableToModify}`;
              $table = $(tableId, $step3);
            }

            const selector = '.cost-params .currency';
            let $currencySpans;
            /*init*/
            const currencySelector = `#selected-currency-${tableToModify}`;
            const initCurrency = $(currencySelector).text().trim();
            /*Пишем в таблицу, какая валюта выбрана*/
            this.setTableCurrency($table, initCurrency);

            $currencySpans = $table.find(selector);
            ctx.changeCellText($currencySpans, initCurrency);
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
            });
          };

          addCalculationEvent = () => {
            const ctx = this;
            $('.cost-field-value').on('keyup paste', function() {
              _logger.dev('run calc ...');
              ctx.runCalculation();
            });

          };

          runCalculation = (action = 'show') => {
            let totalArray = [];
            const arrivalSumObj = this.calcArrival();
            const deliverySumObj = this.calcDelivery();
            const extraSumObj = this.calcExtra();

            totalArray.push(arrivalSumObj);
            totalArray.push(deliverySumObj);
            totalArray.push(extraSumObj);

            this.calcTotal(totalArray, action);
          };

          generateMailCode = function() {
            const _this = this;
            $('#step_3_save-button').on('click', async function(e) {
              /*Запускаем пересчет формы*/
              _this.runCalculation('save');
              $(e.target).trigger('button:load:start');
              const params = await _this.getParams();

              await Generator.run(params);
              $(e.target).trigger('button:load:stop');
            });

          };

          /**
           * Определяем валюту в таблице
           */
          getTableCurrency = (table) => {
            const currency = $(`#table-${table}`).attr('data-currency');
            return currency;
          };

          getTableCurrencyByField = (code) => {

            const values = this.preparedAmoCfValues;
            const mapped = this.mappingByCode[code];
            const mappedId = parseInt(mapped.id);
            const value = values[mappedId];

            return value;
          };

          /**
           * Вычисляем ВСЕГО ДО ПУНКТА НАЗНАЧЕНИЯ таблицы arrival
           */
          calcArrival = () => {
            const that = this;
            const tableCurrency = this.getTableCurrency('arrival');
            const $form = $('#step-3-form');
            const $table = $('#table-arrival', $form);
            /*!!! Устарело: Определяем размерность тарифа - кг или партия. Если кг, то получаем значение объемного
                       веса в кг*/
            //const airFareDimension = $('#cell-air_fare .dimension', $table).attr('data-selected-param');

            //let airFareValue = $('input.field_air_fare', $table).val();
            //let airFareValue = that.getFieldValue('air_fare', that.preparedAmoCfValues);
            /*!!! Теперь так: У авиатарифа свое поле размерности, по ниму и считаем*/

            let airFareDimension = that.getFieldValue('air_fare_dimension', that.preparedAmoCfValues);
            let totalSum = 0;
            const $cells = $('.cell-value input', $table);
            $cells.each(function() {
              let value = $(this).val();

              totalSum += parseFloat(Custom.prepareCalcValue(value));
            });
            Custom.writeTotal($table, totalSum);
            //$('.table-total-value', $table).text(totalSumToTable);

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
            const $form = $('#step-3-form');
            const $table = $('#table-delivery', $form);

            /*Определяем размерность "Терминальная обработка в аэропорту прилета" - кг или партия. Если кг, то
             получаем значение объемного веса в кг*/
            const terminalDimension = $('#cell-terminal_handling_arrival .dimension').attr('data-selected-param');
            let terminalValue = $('input.field_terminal_handling_arrival').val();
            let totalSum = 0;
            const $cells = $('.cell-value input', $table);
            $cells.each(function() {
              let value = $(this).val();
              /*Проверяем случай, если это авиатариф*/
              if ($(this).hasClass('field_terminal_handling_arrival')) {
                if (terminalDimension === 'кг') {
                  const weight = $('input.field_payable_weight').val();
                  if (weight) {
                    value = terminalValue * weight;
                    _logger.dev('airFareValue = ', terminalValue);
                  }
                }
              }

              totalSum += parseFloat(Custom.prepareCalcValue(value));
            });
            Custom.writeTotal($table, totalSum);
            //$('.table-total-value', $table).text(this.formatFloat(totalSum));
            return {
              sum: totalSum,
              currency: tableCurrency,
            };
          };

          calcExtra = () => {
            const tableCurrency = this.getTableCurrency('extra');
            const $form = $('#step-3-form');
            const $table = $('#table-extra', $form);
            let totalSum = 0;
            const $cells = $('.cell-value input', $table);
            $cells.each(function() {
              let value = $(this).val();
              /*Проверяем случай, если это авиатариф*/
              totalSum += parseFloat(Custom.prepareCalcValue(value));
            });
            Custom.writeTotal($table, totalSum);
            //$('.table-total-value', $table).text(this.formatFloat(totalSum));
            return {
              sum: totalSum,
              currency: tableCurrency,
            };
          };

          calcTotal = function(totalArray, action) {
            const that = this;
            let totalSum = 0;
            const $form = $('#step-3-form');
            const $table = $('#table-total', $form);
            totalArray.forEach((table) => {
              let sum = table.sum;
              if (table.currency !== undefined && table.currency !== 'РУБ') {
                const rate = Custom.getCurrencyRate(table.currency, that.preparedParams);
                sum = sum * rate;
              }
              totalSum += sum;
            });
            Custom.writeTotal($table, totalSum);

            // Вычисляем прибыль и пишем в поле и бюджет сделки
            const totalWoCommission = that.getFieldValue('total_wo_commission', that.preparedAmoCfValues);
            const totalWithCommissionBefore = that.getFieldValue('total_with_commission', that.preparedAmoCfValues);
            const totalWithCommission = $('#step-3-form #table-total .total-field-value').val();
            /* "total_destination_step3": "Всего до пункта прилета",*/
            const totalDestinationStep3 = $('#step-3-form #table-arrival .total-field-value').val();
            /* "air_fare_step3": "Авиатариф",*/
            const airFareStep3 = $('#step-3-form #cell-air_fare .field_air_fare').val();
            // Получаем дробную часть от всего с комиссией, чтобы сохранить ее в отдельное поле
            const totalWithCommissionArray = (totalWithCommission + '').split('.');

            const prePaidFraction = totalWithCommissionArray[1];
            const preparedPaidFraction = Utils.zeroPad(prePaidFraction, 2);

            /*Вычитаем из totalSum сумму комиссии*/

            const commissionType = that.getFieldValue('commission_type', this.preparedAmoCfValues);
            let commission = that.getFieldValue('commission', this.preparedAmoCfValues);
            if (commissionType === 'кг') {
              commission = commission * that.getFieldValue('payable_weight', this.preparedAmoCfValues);
            }
            const totalIncome = Custom.formatFloat(parseFloat(totalWithCommission) - parseFloat(totalWoCommission));
            const fieldsUpdate = [
              {
                id: this.mappingByCode['total_income'].id,
                value: totalIncome,
              },
              {
                /*"total_with_commission": "Всего с комиссией",*/
                id: this.mappingByCode['total_with_commission'].id,
                value: totalWithCommission,
              },
              {
                /* "total_destination_step3": "Всего до пункта прилета",*/
                id: this.mappingByCode['total_destination_step3'].id,
                value: totalDestinationStep3,
              },
              {
                /* "air_fare_step3": "Авиатариф",*/
                id: this.mappingByCode['air_fare_step3'].id,
                value: airFareStep3,
              },
              {
                /*"pre_paid_fraction": "Сумма предоплаты_дробная"*/
                id: this.mappingByCode['pre_paid_fraction'].id,
                value: preparedPaidFraction,
              },
            ];

            if (action === 'save') {
              Custom.updateLeadFields(fieldsUpdate);
              const leadId = AmoSettings.leadId();

              /*Проверяем, стоит ли дата отчета - если да, то бюджет обновлять не нужно!*/
              const incomeFieldValue = that.getFieldValue('income_fields', this.preparedAmoCfValues);
              if (!incomeFieldValue) {

                AmoPrivateApi.updateLeadPrice(leadId, totalIncome,
                    (response) => {
                      console.log(JSON.stringify(response, null, 4));
                    }, (error) => {console.error('error: ' + JSON.stringify(error, null, 4));},
                );
              }
            }

          };

        }

        return new Step3();

      };
    });