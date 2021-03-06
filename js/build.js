var container = $('[data-onboarding-id]');
var id = $(container).data('onboarding-id');
var uuid = Fliplet.Widget.getUUID(id);
var config = Fliplet.Widget.getData(id);
var pvKey = 'fl-onboarding-layout-' + uuid;
var delayTime = config.delaySlides ? config.delaySlides * 1000 : 3000;

var initOnboarding = function () {
  var swiperElement = $(container).find('.swiper-container');
  var swiper = new Swiper( swiperElement, {
    direction: 'horizontal',
    loop: false,
    autoHeight: true,
    pagination: '.swiper-pagination-' + id,
    paginationClickable: true,
    nextButton: '.swiper-button-next-' + id,
    prevButton: '.swiper-button-prev-' + id,
    grabCursor: true
  });
  $(container).removeClass('loading');

  swiper.update();

  $(window).on('resize', function() {
    swiper.update();
  });

  Fliplet.Hooks.on('appearanceChanged', function () {
    swiper.update();
  });

  $(container).find('.ob-skip span').click(function () {
    Fliplet.Analytics.trackEvent({
      category: 'onboarding',
      action: 'skip'
    });

    if (config.skipSeenEnabled) {
      return Fliplet.App.Storage.set(pvKey, {
        seen: true
      }).then(function() {
        if (!_.isEmpty(_.get(config, 'skipLinkAction'))) {
          Fliplet.Navigate.to(config.skipLinkAction);
        }
      });
    }

    if (!_.isEmpty(_.get(config, 'skipLinkAction'))) {
      Fliplet.Navigate.to(config.skipLinkAction);
    }
  });

  $(container).find('.btn[data-slide-button-id]').click(function (event) {
    event.preventDefault();
    var itemData = _.find(config.items,{ id: $(this).data('slide-button-id') });

    Fliplet.Analytics.trackEvent({
      category: 'onboarding',
      action: 'button_click',
      label: $(this).val()
    });

    if (config.skipSeenEnabled) {
      return Fliplet.App.Storage.set(pvKey, {
        seen: true
      }).then(function() {
        if (!_.isEmpty(_.get(itemData, 'linkAction'))) {
          Fliplet.Navigate.to(itemData.linkAction);
        }
      });
    }

    if (!_.isEmpty(_.get(itemData, 'linkAction'))) {
      Fliplet.Navigate.to(itemData.linkAction);
    }
  });
}

var debounceLoad = _.debounce(initOnboarding, 500);

Fliplet.Studio.onEvent(function (event) {
  if (event.detail.event === 'reload-widget-instance') {
    debounceLoad();
  }
});

// Initialization
if (config.skipSeenEnabled && !_.isUndefined(config.seenLinkAction) && !_.isEmpty(config.seenLinkAction)) {
  Fliplet.App.Storage.get(pvKey).then(function(value) {
    if (value && value.seen && !Fliplet.Env.get('interact')) {
      setTimeout(function() {
        Fliplet.Navigate.to(config.seenLinkAction).catch(function () {
          initOnboarding();
        });
      }, 800);
      return;
    }

    if (config.enableDelay && !Fliplet.Env.get('interact')) {
      setTimeout(initOnboarding, delayTime);
    } else {
      initOnboarding();
    }
  });
} else {
  if (config.enableDelay && !Fliplet.Env.get('interact')) {
    setTimeout(initOnboarding, delayTime);
  } else {
    initOnboarding();
  }
}