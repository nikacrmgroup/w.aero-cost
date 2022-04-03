'use strict';

define([], function() {
  return {

    /**
     * Словарь и выбор полей по продукту для второго шага.
     * arrival - поля, которые попадут в часть таблицы "до пункта прилета".
     * delivery - поля, которые попадут в часть таблицы "доставка".
     * extra - поля, которые попадут в часть таблицы "дополнительные услуги". если поле пустое - то его
     *  не выводить.
     *  option_fields - поля, которые выводить только если они заполнены, не зависимо от того, где они
     *  выводятся.
     * required  -обязательные поля
     */
    step2productFields: (product) => {
      const fieldChoice = {
        AGENT: {
          arrival: ['air_fare', 'awb'], delivery: [], option_fields: [], extra: [], required: ['air_fare', 'awb'],
        }, AA: {

          arrival: [
            'air_fare',
            'awb',
            'placing_cargo_departure',
            'terminal_handling_departure',
            'terminal_handling_departure_for_kg',
            'terminal_handling_departure_for_volume',
            'insurance',
            'packaging',
            'danger_declaration',
            'danger_marking',
            'export_TO'],
          delivery: [],
          extra: [],
          option_fields: [],
          required: [
            'air_fare',
            'awb',
            'placing_cargo_departure',
            'terminal_handling_departure',
            'terminal_handling_departure_for_kg',
            'terminal_handling_departure_for_volume'],
        }, AD: {
          arrival: [
            'air_fare',
            'awb',
            'placing_cargo_departure',
            'terminal_handling_departure',
            'terminal_handling_departure_for_kg',
            'terminal_handling_departure_for_volume',
            'insurance',
            'packaging',
            'danger_declaration',
            'danger_marking',
            'export_TO'],
          delivery: [
            'receiving_cargo_arrival',
            'terminal_handling_arrival',
            'terminal_handling_arrival_for_kg',
            'terminal_handling_arrival_for_volume',
            'auto_delivery_recipient',
            'import_TO'],
          extra: [],
          option_fields: [],
          required: [
            'air_fare',
            'awb',
            'placing_cargo_departure',
            'terminal_handling_departure',
            'terminal_handling_departure_for_kg',
            'terminal_handling_departure_for_volume',
            'terminal_handling_arrival',
            'terminal_handling_arrival_for_kg',
            'terminal_handling_arrival_for_volume',
            'receiving_cargo_arrival',
            'auto_delivery_recipient'],
        }, DA: {
          arrival: [
            'air_fare',
            'awb',
            'placing_cargo_departure',
            'terminal_handling_departure',
            'terminal_handling_departure_for_kg',
            'terminal_handling_departure_for_volume',
            'auto_delivery_sender',
            'insurance',
            'packaging',
            'danger_declaration',
            'danger_marking',
            'export_TO'],
          delivery: [],
          extra: [/*'insurance', 'packaging', 'danger_declaration', 'danger_marking', 'import_TO', 'export_TO'*/],
          option_fields: [/*'export_TO'*/],
          required: [
            'air_fare',
            'awb',
            'placing_cargo_departure',
            'terminal_handling_departure',
            'terminal_handling_departure_for_kg',
            'terminal_handling_departure_for_volume',
            'auto_delivery_sender'],
        }, DD: {
          arrival: [
            'air_fare',
            'awb',
            'placing_cargo_departure',
            'terminal_handling_departure',
            'terminal_handling_departure_for_kg',
            'terminal_handling_departure_for_volume',
            'auto_delivery_sender',
            'insurance',
            'packaging',
            'danger_declaration',
            'danger_marking',
            'export_TO'],
          delivery: [
            'receiving_cargo_arrival',
            'terminal_handling_arrival',
            'terminal_handling_arrival_for_kg',
            'terminal_handling_arrival_for_volume',
            'auto_delivery_recipient',
            'import_TO'],
          extra: [/*'insurance', 'packaging', 'danger_declaration', 'danger_marking', 'import_TO', 'export_TO'*/],
          option_fields: [/*'export_TO', 'import_TO'*/],
          required: [
            'air_fare',
            'awb',
            'placing_cargo_departure',
            'terminal_handling_departure',
            'terminal_handling_departure_for_kg',
            'terminal_handling_departure_for_volume',
            'auto_delivery_sender'],
        }, HA: {
          arrival: [], delivery: [
            'receiving_cargo_arrival',
            'terminal_handling_arrival',
            'terminal_handling_arrival_for_kg',
            'terminal_handling_arrival_for_volume',
            'import_TO'], extra: [/*'import_TO', 'export_TO'*/], option_fields: [/*'import_TO'*/], required: [
            'receiving_cargo_arrival',
            'terminal_handling_arrival',
            'terminal_handling_arrival_for_kg',
            'terminal_handling_arrival_for_volume'],
        }, HD: {
          arrival: [], delivery: [
            'receiving_cargo_arrival',
            'terminal_handling_arrival',
            'terminal_handling_arrival_for_kg',
            'terminal_handling_arrival_for_volume',
            'auto_delivery_recipient',
            'import_TO'], extra: [/*'import_TO', 'export_TO'*/], option_fields: [/*'import_TO'*/], required: [
            'receiving_cargo_arrival',
            'terminal_handling_arrival',
            'terminal_handling_arrival_for_kg',
            'terminal_handling_arrival_for_volume',
            'auto_delivery_recipient'],
        },
      };
      let chosen;
      if (!product) {
        chosen = fieldChoice['AGENT'];
      }
      else {
        chosen = fieldChoice[product];
      }

      return chosen;
    },

    /**
     * Словарь и выбор полей по продукту шаг3.
     * arrival - поля, которые попадут в часть таблицы "до пункта прилета".
     * delivery - поля, которые попадут в часть таблицы "доставка".
     * extra - поля, которые попадут в часть таблицы "дополнительные услуги". если поле пустое - то его
     *  не выводить.
     *  option_fields - поля, которые выводить только если они заполнены, не зависимо от того, где они
     *  выводятся.
     * required  -обязательные поля
     */
    step3productFields: (product) => {
      const fieldChoice = {
        AGENT: {
          arrival: ['air_fare', 'awb'], delivery: [], option_fields: [], extra: [], required: ['air_fare', 'awb'],
        }, AA: {

          arrival: [
            'air_fare',
            'awb',
            'placing_cargo_departure',
            'terminal_handling_departure',
            'insurance',
            'packaging',
            'danger_declaration',
            'danger_marking',
            'export_TO'],
          delivery: [],
          extra: [/*'insurance', 'packaging', 'danger_declaration', 'danger_marking', 'import_TO', 'export_TO'*/],
          option_fields: [/*'export_TO'*/],
          required: [
            'air_fare', 'awb', 'placing_cargo_departure', 'terminal_handling_departure'],
        }, AD: {
          arrival: [
            'air_fare',
            'awb',
            'placing_cargo_departure',
            'terminal_handling_departure',
            'insurance',
            'packaging',
            'danger_declaration',
            'danger_marking',
            'export_TO'],
          delivery: [
            'receiving_cargo_arrival', 'terminal_handling_arrival', 'auto_delivery_recipient', 'import_TO'],
          extra: [/*'insurance', 'packaging', 'danger_declaration', 'danger_marking', 'import_TO', 'export_TO'*/],
          option_fields: [/*'export_TO', 'import_TO'*/],
          required: [
            'air_fare', 'awb', 'placing_cargo_departure', 'terminal_handling_departure',

            'receiving_cargo_arrival', 'terminal_handling_arrival', 'auto_delivery_recipient'],
        }, DA: {
          arrival: [
            'air_fare',
            'awb',
            'placing_cargo_departure',
            'terminal_handling_departure',
            'auto_delivery_sender',
            'insurance',
            'packaging',
            'danger_declaration',
            'danger_marking',
            'export_TO'],
          delivery: [],
          extra: [/*'insurance', 'packaging', 'danger_declaration', 'danger_marking', 'import_TO', 'export_TO'*/],
          option_fields: [/*'export_TO'*/],
          required: [
            'air_fare', 'awb', 'placing_cargo_departure', 'terminal_handling_departure', 'auto_delivery_sender'],
        }, DD: {
          arrival: [
            'air_fare',
            'awb',
            'placing_cargo_departure',
            'terminal_handling_departure',
            'auto_delivery_sender',
            'insurance',
            'packaging',
            'danger_declaration',
            'danger_marking',
            'export_TO'],
          delivery: [
            'receiving_cargo_arrival', 'terminal_handling_arrival', 'auto_delivery_recipient', 'import_TO'],
          extra: [/*'insurance', 'packaging', 'danger_declaration', 'danger_marking', 'import_TO', 'export_TO'*/],
          option_fields: [/*'export_TO', 'import_TO'*/],
          required: [
            'air_fare', 'awb', 'placing_cargo_departure', 'terminal_handling_departure', 'auto_delivery_sender'],
        }, HA: {
          arrival: [],
          delivery: [
            'receiving_cargo_arrival', 'terminal_handling_arrival', 'import_TO'],
          extra: [/*'import_TO', 'export_TO'*/],
          option_fields: [/*'import_TO'*/],
          required: [
            'receiving_cargo_arrival', 'terminal_handling_arrival'],
        }, HD: {
          arrival: [],
          delivery: [
            'receiving_cargo_arrival', 'terminal_handling_arrival', 'auto_delivery_recipient', 'import_TO'],
          extra: [/*'import_TO', 'export_TO'*/],
          option_fields: [/*'import_TO'*/],
          required: [
            'receiving_cargo_arrival', 'terminal_handling_arrival', 'auto_delivery_recipient'],
        },
      };

      return fieldChoice[product];
    },
  };
});