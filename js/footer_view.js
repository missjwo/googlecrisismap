// Copyright 2012 Google Inc.  All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License.  You may obtain a copy
// of the License at: http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software distrib-
// uted under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, either express or implied.  See the License for
// specific language governing permissions and limitations under the License.

/**
 * @fileoverview The footer below the map in the UI.
 */

goog.provide('cm.FooterView');

goog.require('cm');
goog.require('cm.Html');
goog.require('cm.MapModel');
goog.require('cm.ui');
goog.require('goog.Uri');

/**
 * The footer below the map in the UI, which includes some custom text from the
 * map model as well as a "Help" link that shows a popup.
 * @param {Element} parentElem The DOM element in which to place the footer.
 * @param {Element} popupContainer The DOM element on which to center the
 *     "Help" popup window.
 * @param {cm.MapModel} mapModel The map model.
 * @param {Object} footerParams Parameters necessary for footer rendering.
 *     publisher_name: The publisher's name.
 *     langs: A list of the BCP 47 codes of all supported languages.
 * @constructor
 */
cm.FooterView = function(parentElem, popupContainer, mapModel, footerParams) {
  /**
   * @type cm.MapModel
   * @private
   */
  this.mapModel_ = mapModel;

  /**
   * @type Element
   * @private
   */
  this.footerSpan_ = cm.ui.create('span');

  /**
   * @type Element
   * @private
   */
  this.langContainer_;

  this.appendPublisher_(parentElem, footerParams);
  cm.ui.append(parentElem, this.footerSpan_);

  var uri = new goog.Uri(goog.global.location);
  if (window != window.top) {
    uri.removeParameter('embedded');
    var fullMapLink = cm.ui.createLink(cm.MSG_FULL_MAP_LINK, '' +
        uri, '_blank');
    cm.ui.append(parentElem, cm.ui.SEPARATOR_DOT, fullMapLink);
  }

  // Show the language selector only on published maps.
  var langs = footerParams['langs'];
  var langSelect = cm.ui.create('select');
  // Add default as the first item.
  var langChoices = goog.array.concat(
      [{'value': '', 'label': cm.MSG_LANGUAGE_DEFAULT}],
      cm.util.createLanguageChoices(langs));
  goog.array.forEach(langChoices, function(langChoice) {
    cm.ui.append(langSelect, cm.ui.create('option',
        {'value': langChoice.value}, langChoice.label));
  });
  var hlParam = uri.getParameterValue('hl');
  langSelect.value = hlParam || '';
  cm.ui.append(parentElem, this.langContainer_ =
      cm.ui.create('div', {'class': cm.css.LANGUAGE_PICKER_CONTAINER},
          cm.ui.SEPARATOR_DOT,
          cm.ui.create('div', {'class': cm.css.LANGUAGE_PICKER_ICON}),
          langSelect));
  // Change URL parameter and reload when another language is selected.
  cm.events.listen(langSelect, 'change', function(e) {
    var newUri = (this.value === '') ? uri.removeParameter('hl') :
        uri.setParameterValue('hl', this.value);
    goog.global.location.replace(newUri.toString());
  }, langSelect);
  cm.events.onChange(mapModel, 'footer', this.updateFooter_, this);
  this.updateFooter_();
};

/** @private Updates the footer to match the MapModel. */
cm.FooterView.prototype.updateFooter_ = function() {
  cm.ui.clear(this.footerSpan_);
  var footer = /** @type cm.Html */(this.mapModel_.get('footer'));
  if (footer.isEmpty()) {
    return;
  }
  var span = cm.ui.create('span');
  footer.pasteInto(span);
  cm.ui.append(this.footerSpan_, cm.ui.SEPARATOR_DOT, span);
};

/**
 * Renders the publisher into parentElem.
 * @param {Element} parentElem The element receiving the rendered publisher.
 * @param {Object} footerParams The parameters for the footer as received at
 *   initialization.
 * @private
 */
cm.FooterView.prototype.appendPublisher_ = function(parentElem, footerParams) {
  var publisherName = footerParams['publisher_name'];
  if (!publisherName) return;
  var span = cm.ui.create('span');
  new cm.Html(cm.getMsgPublisherAttribution(publisherName)).pasteInto(span);
  cm.ui.append(parentElem, span);
};
