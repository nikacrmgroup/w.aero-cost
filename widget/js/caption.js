'use strict';

define(['jquery', 'lib/components/base/modal'], function($, Modal) {
  return function(_widget, _logger, _form) {
    class Caption {
      isLeadCard = () => {
        let data = AMOCRM.data;
        return data.is_card && (data.current_entity === 'leads') &&
            data.current_card.id;
      };

      addCaption = () => {
        if (this.isLeadCard()) {
          let caption = `<div class="aero-cost-caption-wrap">
        <div class="aero-cost-btn" title="Расчет доставки">
            <div class="aero-cost-btn__ico"></div>
            <div class="aero-cost-btn__text">Расчет доставки</div>
            <div class="aero-cost-btn__loader"></div>           
        </div>
        <div class="aero-cost-info">
         <div class="aero-cost-info__last_update"></div>
         <div class="aero-cost-info__message"></div>
        </div>
        
    </div>`;
          $('.aero-cost-caption').replaceWith(caption);
          this.addEvent(_widget);
        }

      };

      addEvent() {
        /* По клику на кнопку отправляем запрос на обновление */
        $('.aero-cost-btn').on('click', function(e) {
          e.preventDefault();
          let $this = $(this);
          let leadId = AMOCRM.data.current_card.id;

          _form.render();

        });

      }
    }

    return new Caption();

  };
});