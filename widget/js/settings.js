'use strict';

define([
      'jquery',
      '../libs/amoSettings.js',
      '../libs/amoPrivateApi.js',
      './utils.js',
      '../libs/amoDictionary.js',
      'underscore',
    ],
    function($, AmoAccount, Api, WidgetUtils, Dictionary, _) {
      return function(_$modal_body, _widget, _templater, _logger, _config) {

        this.render = function() {
          let ctx = this;
          ctx.settings = this.getSettings();
          _logger.show('Настройки рендерятся');
          this.prepareModal(ctx);
          this.renderModal(ctx).then(function() {
            _logger.show('Настройки отображены!');
          });
        };

        this.renderModal = async function(ctx) {
          await this.renderOptions(ctx);
          await this.renderFieldsMapping(ctx);

        };

        this.prepareModal = function(ctx) {

          _$modal_body.find(
              '.widget_settings_block__item_field:last').
              after(`
            <div class="nika-settings-wrapper">
                  <div class="options"></div>
                  <div class="mapping"></div>
   
            </div>
            `);

          ctx.$wrapper = $('.nika-settings-wrapper');
          ctx.$optionsWrapper = $('.options', ctx.$wrapper);
          ctx.$mappingWrapper = $('.mapping', ctx.$wrapper);


        };

        this.renderManagers = function(ctx) {

          let managers = $.extend(true, {}, AmoAccount.managers());
          managers = Object.values(managers);

          _logger.show('Получены менеджеры ', managers);
          if (managers) {
            managers.forEach(function(manager, index) {
              ctx.settings.forEach(function(element) {
                if (element === `manager.${manager.id}`) {
                  managers[index]['is_checked'] = true;
                }
              });

            });
            /*Готовим параметры менеджеров из актуальных и сохраненных*/
            const templateParams = {
              managers,
            };
            _templater.render('active_managers',
                function(template, base_params) {
                  ctx.$managersWrapper.html(
                      template.render(
                          $.extend({}, base_params, templateParams, {})));
                  ctx.addSaveEvents(ctx);
                });
          }
          else {
            _logger.error('Ошибка получения пользователей!', managers);
          }
        };

        this.renderOptions = function(ctx) {
          _logger.show('Рендер опций');
          const templateParams = {
            closeOption: false,
            onlyResponsible: false,
          };
          if (Array.isArray(ctx.settings) && ctx.settings.length) {
            ctx.settings.forEach(function(element) {
              if (element === `close-option`) {
                templateParams.closeOption = true;
              }
              if (element === `only_responsible`) {
                templateParams.onlyResponsible = true;
              }
            });
          }
          _templater.render('options',
              function(template, base_params) {
                ctx.$optionsWrapper.html(
                    template.render(
                        $.extend({}, base_params, templateParams, {})));
                ctx.addSaveEvents(ctx);
              });
        };

        this.renderFieldsMapping = function(ctx) {
          /*Получаем копию всех полей*/
          let amoFields = $.extend(true, {}, AmoAccount.cfAll());
          amoFields = Object.values(amoFields);

          _logger.show('Получены поля amo', amoFields);
          if (amoFields) {
            /*Получаем имена полей калькулятора*/
            let amoFieldsFormatted = [];
            const fieldDesc = {
              id: 'n-first-select',
              name: `n-first-select`,
              value: `Выберите поле`,
            };
            amoFieldsFormatted.push(fieldDesc);
            amoFields.forEach(function(field, index) {
              let fieldItem = {
                id: field.ID,
                name: `n-cf-${field.ID}`,
                value: `${field.NAME} #${field.ID}`,
              };
              amoFieldsFormatted.push(fieldItem);
            });
            const calcFields = _widget.i18n('mapping');

            /*Подготавливаем для рендера маппинг. Если элемент из настроек
             имеет ###  то  это элемент маппинга*/
            let mapping = {};
            if (Array.isArray(ctx.settings) && ctx.settings.length) {
              ctx.settings.forEach(function(element) {
                if (element.includes('###')) {
                  let mappedField = element.split('###');
                  mapping[mappedField[0]] = mappedField[1];
                }

              });
            }

            const templateParams = {
              amoFieldsFormatted,
              calcFields,
              mapping: mapping,
            };
            _templater.render('fields_mapping',
                function(template, base_params) {
                  ctx.$mappingWrapper.html(
                      template.render(
                          $.extend({}, base_params, templateParams, {})));
                  ctx.addSaveEvents(ctx);
                });
          }
          else {
            _logger.error('Ошибка получения полей!', amoFields);
          }
        };

        this.renderStages = async function(ctx) {

          let pipelines = $.extend(true, {}, await Api.pipelines());
          pipelines = Object.values(pipelines);
          const preparedPipelines = await WidgetUtils.preparePipelines(
              pipelines);
          if (preparedPipelines) {
            preparedPipelines.forEach(function(pipeline, index) {
              let statuses = pipeline.statuses;
              statuses.forEach(function(status, id) {
                //TODO переделать настройки в объект "быстрого доступа"
                ctx.settings.forEach(function(element) {
                  if (element === `status.${pipeline.id}.${status.id}`) {
                    preparedPipelines[index]['statuses'][id]['is_checked'] = true;
                  }
                });
              });

            });

            const templateParams = {
              pipelines: preparedPipelines,
            };
            _logger.dev('Воронки без сорта:', pipelines);
            _logger.dev('Воронки сортированные:', preparedPipelines);
            await _templater.render('active_statuses',
                function(template, base_params) {
                  ctx.$stagesWrapper.html(
                      template.render(
                          $.extend({}, base_params, templateParams, {})));
                  ctx.addSaveEvents(ctx);
                });
          }
          else {
            _logger.error('Ошибка получения воронок!', managers);
          }

        };
        this.renderAreas = function(ctx) {
          _logger.show('Рендер опции выбора мест работы виджета');
          let areas = $.extend(true, [], Dictionary.amoAreas);

          areas.forEach(function(area, index) {
            ctx.settings.forEach(function(element) {
              if (element === `area.${area.value}`) {
                areas[index]['is_checked'] = true;
              }
            });
          });

          const templateParams = {
            areas,
          };
          _templater.render('active_areas',
              function(template, base_params) {
                ctx.$areasWrapper.html(
                    template.render(
                        $.extend({}, base_params, templateParams, {})));
                ctx.addSaveEvents(ctx);
              });

        };
        this.addSaveEvents = function(ctx) {
          const that = this;
          let nika_update_settings = function(e) {
            that.save();
          };
          ctx.$wrapper.find('input').
              on('click, controls:change', nika_update_settings);
        };
        this.save = function() {
          _logger.show('Сохраняем...');

          const code = _config.widget.code;
          const $storageField = $(`#${code}_custom`, _$modal_body);
          const $checkedInputs = $(`.nika-settings-wrapper input:checked`,
              _$modal_body);
          let storage = [];
          $checkedInputs.each(function(key, value) {
            storage.push($(value).attr('name'));
          });

          const $mappedFields = $('.nika-mapping-field input', _$modal_body);
          //storage.mapping = {};
          $mappedFields.each(function(key, value) {
            let fieldName = $(value).attr('name');
            let fieldValueId = $(value).attr('data-value-id');
            /*Проверяем, не первый ди это элемент списка, который по-умолчанию*/
            if (fieldValueId !== 'n-first-select') {
              //storage.mapping[fieldName] = fieldValueId;
              storage.push(`${fieldName}###${fieldValueId}`);
            }
          });
          let storageObject = Object.assign({}, storage);
          const storageString = JSON.stringify(storageObject);

          $storageField.val(storageString).trigger('change');

        };

        this.getSettings = function() {
          const allSettings = _widget.get_settings();
          let settings = allSettings.storage;
          if (settings !== undefined) {
            if (Array.isArray(settings)) {
              _logger.dev('массив с настройками settings...', settings);

            }
            else if (WidgetUtils.isJsonString(settings)) {
              settings = Object.values(JSON.parse(settings));
            }
            else if (settings.constructor === Object) {
              _logger.dev('Настройки это объект', settings);
            }

          }
          else {
            _logger.dev('Настройки пусты...', settings);
            settings = [];
          }

          return settings;
        };

      };
    });