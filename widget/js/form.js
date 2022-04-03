'use strict';

define(['jquery', './custom.js', './utils.js', './generator.js'], function($, Custom, Utils, Generator) {
  return function(_widget, _logger, _templater, _container) {
    $.fn.fadeOutAndRemove = function(speed) {
      $(this).fadeOut(speed, function() {
        $(this).remove();
      });
    };

    class Form {

      constructor() {
        this.ctx = {};

      }

      async render() {

        const that = this;
        _templater.renderTwig('overlay', {}, function(content) {
          $('body').append(content);
          that.renderForm();
        });

      }

      async renderForm() {
        const that = this;
        /*Обновляем или пишем новые данные по курсу валют*/
        const rates = await this.updateCurrencyRate();
        const step_1_params = await _container.getStep1().getParams();

        const templateParams = {
          step_1_params,

          closeOption: true,
        };
        _templater.renderTwig('modal', templateParams, function(content) {
          $('body').append(content);
          that.updateCurrencyContainer(rates);

          $('.nika_aero-cost-boxes-layer').fadeOutAndRemove('fast');
          $('.nika-aero-cost-modal__close, #nika_aero-cost_modal_layer').click(function() {
            $('.nika-aero-cost-modal, #nika_aero-cost_modal_layer').
                fadeOutAndRemove('fast');
          });

          $('.leads_without_aero-cost_row a').click(function() {
            $('.nika-aero-cost-modal, #nika_aero-cost_modal_layer, .nika_aero-cost-boxes-layer').
                fadeOutAndRemove('fast');
          });

          that.addEvents();

        });
      }

      addEvents() {
        _container.getStep1().addEvents();
 
        this.addNavEvents();
      }

      updateCurrencyContainer = (rates) => {
        const showContainer = $('#current-currency-rates');
        let lists = '';

        rates.forEach((showRate) => {
          const list = `<li>${showRate.name} : ${showRate.rate}</li>`;
          lists += list;
        });

        const ul = `<ul>${lists}</ul>`;
        showContainer.html(ul);
      };

      updateCurrencyRate = async function() {
        const rates = await Custom.getAllCurrencyRates(Custom.currencyIds);
        return rates;
      };

      renderStep(id, templateParams) {
        const that = this;
        _templater.renderTwig(`form_step_${id}`, templateParams, function(content) {
          $(`#step-form-wrapper-${id}`).html(content);
          switch (id) {
            case '1':
              _container.getStep1().addEvents();
              break;
            case '2':
              _container.getStep2().addEvents();
              break;
            case '3':
              _container.getStep3().addEvents();
              break;
            default:
              break;

          }
        });
      }

      addNavEvents() {
        const that = this;
        $('#switch-step-3').hide();
        const $switchItems = $('.switch-item a');
        $switchItems.each(function() {
          $(this).on('click', async function(e) {
            const clicked = $(e.target);
            if (clicked.attr('data-form-changed')) {

              /*Спрашиваем, продолжать ли без сохранения*/
              if (!confirm(
                  'Данные в форме были изменены, но не сохранены. Перейти к следующему шагу без сохранения?')) {
                return;
              }
              /*Если да, то обнуляем атрибуты*/
              $('#switch-step-3').removeAttr('data-form-changed');
              $('#switch-step-2').removeAttr('data-form-changed');
              $('#switch-step-1').removeAttr('data-form-changed');
            }

            const stepNumber = clicked.attr('data-step-id');
            let isValidationError = false;
            const switchItemId = $('.switch-item .active').attr('data-step-id');
            if (switchItemId !== '3') {
              //Автосохранение шагов формы
              //that.saveForm(switchItemId);

            }
            if (stepNumber === '1') {
              $('#switch-step-3').hide();
            }
            if (stepNumber === '2') {
              $('#switch-step-3').show();
              const step_2_params = await _container.getStep2().getParams();
              const templateParams = {
                params: step_2_params,
              };
              that.renderStep(stepNumber, templateParams);
            }
            if (stepNumber === '3') {
              /*Проверяем обязательные поля*/
              const $saveBtn = $('#step_2_save-button');

              if (Custom.isRequiredFilled($saveBtn)) {
                const step_3_params = await _container.getStep3().getParams();
                const templateParams = {
                  params: step_3_params,
                };
                that.renderStep(stepNumber, templateParams);

              }
              else {
                isValidationError = true;
              }

            }
            if (!isValidationError) {
              $switchItems.removeClass('active');
              $('.form-step__wrapper').removeClass('active');
              clicked.toggleClass('active');
              $(`#step-form-wrapper-${stepNumber}`).toggleClass('active');
            }

          });
        });
      }

      /**
       * Сохраняем поля формы, при этом используем кнопку как определение формы
       * @param stepNumber
       */
      saveForm(stepNumber) {
        const $saveBtn = $(`#step_${stepNumber}_save-button`);
        Custom.updateLeadWithBtn($saveBtn);
      }

    }

    return new Form();

  };
})
;