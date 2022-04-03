'use strict';

define(['jquery'], function($) {
  return {
    checkArea(_widget, area) {
      const currentArea = _widget.system().area;
      return area.includes(currentArea);
    },

    preparePipelines(pipelines) {
      const pipelinesArray = Object.values(pipelines);
      let that = this;
      let pipelinesToSort = [];
      pipelinesArray.forEach(function(pipeline, index) {
        const statuses = pipeline['statuses'];
        let statusesArray = Object.values(statuses);
        pipeline.statuses = statusesArray.sort(that.dynamicSort('sort'));
        pipelinesToSort.push(pipeline);
      });

      return pipelinesToSort.sort(that.dynamicSort('sort'));
    },
    dynamicSort(property) {
      let sortOrder = 1;
      if (property[0] === '-') {
        sortOrder = -1;
        property = property.substr(1);
      }
      return function(a, b) {
        /* next line works with strings and numbers,
         * and you may want to customize it to your needs
         */
        const result = (a[property] < b[property]) ? -1 : (a[property] >
            b[property]) ? 1 : 0;
        return result * sortOrder;
      };
    },
    isJsonString(str) {
      try {
        JSON.parse(str);
      }
      catch (e) {
        return false;
      }
      return true;
    },
    /**
     * https://www.sohamkamani.com/blog/javascript-localstorage-with-ttl-expiry/
     * @param key
     * @param value
     * @param ttl
     */
    setCache(key, value, ttl) {
      const now = new Date();

      // `item` is an object which contains the original value
      // as well as the time when it's supposed to expire
      const item = {
        value: value,
        expiry: now.getTime() + ttl,
      };
      localStorage.setItem(key, JSON.stringify(item));
    },

    getCache(key) {
      const itemStr = localStorage.getItem(key);

      // if the item doesn't exist, return null
      if (!itemStr) {
        return null;
      }

      const item = JSON.parse(itemStr);
      const now = new Date();


      return item.value;
    },

    /**
     * Возвращает сериализованные значения полей формы
     * @param $form
     * @returns {{}|*|jQuery}
     */
    getFormData($form) {
      let disabled = $form.find(':input:disabled').removeAttr('disabled');
      const unindexed_array = $form.serializeArray();
      disabled.attr('disabled', 'disabled');
      /*Ищем чекбоксы*/
      let checkBoxesObj = {};
      /*Проверяем, не мультичекбокс ли это? По id - у него должен быть такой cbx_drop_22222*/
      $('input:checkbox', $form).each(function() {
        const id = this.id;
        if (id === 'cbx_drop_master_NaN'/*Это первый элемент списка, он не
         нужен*/) {

          return;
        }
        const isChecked = this.checked;
        let enumId = {};
        if (id.includes('cbx_drop_')) {
          if (isChecked) {
            enumId = {
              'enum_id': parseInt(this.value),
            };
          }
          /*Проверяем,есть ли уже массив*/
          if (!Array.isArray(checkBoxesObj[this.name])) {
            checkBoxesObj[this.name] = [];
          }
          checkBoxesObj[this.name].push(enumId);
        }
        else {
          if (this.name !== '') {
            checkBoxesObj[this.name] = this.checked;
          }

        }

      });

      let indexed_array = {};

      $.map(unindexed_array, function(n, i) {
        indexed_array[n['name']] = n['value'];
      });
      indexed_array = Object.assign(indexed_array, checkBoxesObj);
      return indexed_array;
    },
    sanitizeValue: (value) => {
      if (typeof value === 'string') {
        value = value.replace(/,/g, '.');
      }
      return value;
    },
    zeroPad :(num, places) => String(num).padStart(places, '0')
  };
});