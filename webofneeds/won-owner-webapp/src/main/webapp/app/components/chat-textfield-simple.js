/**
 * Also a resizing textfield that can produce messages but it only uses
 * a standard text-area instead of contenteditable. Thus it should be
 * stabler but can't do rich text / wysiwyg-formatting.
 *
 * Created by ksinger on 16.02.2018.
 */

// import Medium from '../mediumjs-es6.js';
import angular from "angular";
import "ng-redux";
import "angular-sanitize";
import ngAnimate from "angular-animate";
import { dispatchEvent, attach, delay } from "../utils.js";
import won from "../won-es6.js";
import {
  selectOpenConnectionUri,
  selectNeedByConnectionUri,
} from "../selectors.js";
import { getAllDetails } from "../won-utils.js";
import autoresizingTextareaModule from "../directives/textarea-autogrow.js";
import { actionCreators } from "../actions/actions.js";
import labelledHrModule from "./labelled-hr.js";

// TODO: these should be replaced by importing defintions from config
import descriptionPickerModule from "./details/picker/description-picker.js";
import locationPickerModule from "./details/picker/location-picker.js";
import personPickerModule from "./details/picker/person-picker.js";
import travelActionPickerModule from "./details/picker/travel-action-picker.js";
import tagsPickerModule from "./details/picker/tags-picker.js";
import titlePickerModule from "./details/picker/title-picker.js";
import ttlPickerModule from "./details/picker/ttl-picker.js";
import numberPickerModule from "./details/picker/number-picker.js";
import datePickerModule from "./details/picker/date-picker.js";
import datetimePickerModule from "./details/picker/datetime-picker.js";
import timePickerModule from "./details/picker/time-picker.js";
import monthPickerModule from "./details/picker/month-picker.js";
import dropdownPickerModule from "./details/picker/dropdown-picker.js";
import selectPickerModule from "./details/picker/select-picker.js";
import rangePickerModule from "./details/picker/range-picker.js";

import "style/_chattextfield.scss";
import "style/_textfield.scss";

function genComponentConf() {
  let template = `
        <div class="cts__details"
          ng-if="self.allowDetails && self.showAddMessageContent">
          <div class="cts__details__grid"
              ng-if="!self.selectedDetail && !self.multiSelectType">
            <won-labelled-hr label="::'Actions'" class="cts__details__grid__hr"
              ng-if="!self.multiSelectType && self.isConnected"></won-labelled-hr>
            <button
                ng-if="self.showAgreementData"
                class="cts__details__grid__action won-button--filled red"
                ng-click="self.activateMultiSelect('accepts')">
                Accept Proposal(s)
            </button>
            <button
                ng-if="!self.showAgreementData"
                class="cts__details__grid__action won-button--filled red"
                ng-click="self.activateMultiSelect('proposes')">
                Make Proposal
            </button>
            <button
                ng-if="self.showAgreementData"
                class="cts__details__grid__action won-button--filled red"
                ng-click="self.activateMultiSelect('rejects')">
                Reject Proposal(s)
            </button>
            <button
                class="cts__details__grid__action won-button--filled red"
                ng-click="self.activateMultiSelect('proposesToCancel')">
                Cancel Agreement(s)
            </button>
            <button class="cts__details__grid__action won-button--filled red"
                ng-click="self.activateMultiSelect('retracts')">
                Retract Message(s)
            </button>
            <won-labelled-hr label="::'Details'" class="cts__details__grid__hr"
              ng-if="!self.multiSelectType && self.isConnected"></won-labelled-hr>
            <div class="cts__details__grid__detail"
              ng-repeat="detail in self.allDetails"
              ng-click="self.pickDetail(detail)">
              <svg class="cts__details__grid__detail__icon" ng-if="detail.icon">
                <use xlink:href={{detail.icon}} href={{detail.icon}}></use>
              </svg>
              <div class="cts__details__grid__detail__label" ng-if="detail.label">
                {{ detail.label }}
              </div>
            </div>
          </div>
          <div class="cts__details__input"
            ng-if="!self.selectedDetail && self.multiSelectType">
            <div class="cts__details__input__header">
              <svg class="cts__details__input__header__back clickable"
                ng-click="self.cancelMultiSelect()">
                <use xlink:href="#ico36_backarrow" href="#ico36_backarrow"></use>
              </svg>
              <svg class="cts__details__input__header__icon">
                <use xlink:href="#ico36_plus_circle" href="#ico36_plus_circle"></use>
              </svg>
              <div class="cts__details__input__header__label">
                {{ self.getMultiSelectActionLabel() }}
              </div>
              <div class="cts__details__input__header__add" ng-click="self.saveReferencedContent()">
                <svg class="cts__details__input__header__add__icon">
                  <use xlink:href="#ico36_added_circle" href="#ico36_added_circle"></use>
                </svg>
                <span class="cts__details__input__header__add__label hide-in-responsive">
                  Save
                </span>
              </div>
              <div class="cts__details__input__header__discard" ng-click="self.removeReferencedContent()">
                <svg class="cts__details__input__header__discard__icon">
                  <use xlink:href="#ico36_close_circle" href="#ico36_close_circle"></use>
                </svg>
                <span class="cts__details__input__header__discard__label hide-in-responsive">
                  Discard
                </span>
              </div>
            </div>
            <div class="cts__details__input__content" ng-if="self.selectedMessages">
              {{ self.selectedMessages.size }} Messages
            </div>
            <div class="cts__details__input__content" ng-if="!self.selectedMessages">
              0 Messages selected
            </div>
          </div>
          <div class="cts__details__input"
            ng-if="self.selectedDetail && !self.multiSelectType">
            <div class="cts__details__input__header">
              <svg class="cts__details__input__header__back clickable"
                ng-click="self.removeAddMessageContent()">
                <use xlink:href="#ico36_backarrow" href="#ico36_backarrow"></use>
              </svg>
              <svg class="cts__details__input__header__icon">
                <use xlink:href={{self.selectedDetail.icon}} href={{self.selectedDetail.icon}}></use>
              </svg>
              <div class="cts__details__input__header__label">
                {{ self.selectedDetail.label }}
              </div>
              <!--div class="cts__details__input__header__add">
                <svg class="cts__details__input__header__add__icon">
                  <use xlink:href="#ico36_added_circle" href="#ico36_added_circle"></use>
                </svg>
                <span class="cts__details__input__header__add__label hide-in-responsive">
                  Save
                </span>
              </div>
              <div class="cts__details__input__header__discard">
                <svg class="cts__details__input__header__discard__icon">
                  <use xlink:href="#ico36_close_circle" href="#ico36_close_circle"></use>
                </svg>
                <span class="cts__details__input__header__discard__label hide-in-responsive">
                  Discard
                </span>
              </div-->
            </div>
            <div class="cts__details__input__content"
              message-detail-element="{{self.selectedDetailComponent}}"
              on-update="::self.updateDetail(identifier, value)"
              initial-value="::self.additionalContent.get(self.selectedDetail.identifier)"
              identifier="self.selectedDetail.identifier"
              detail="self.selectedDetail">
            </div>
          </div>
        </div>
        <button class="cts__add"
          ng-disabled="!self.allowDetails"
          ng-click="self.toggleAddMessageContentDisplay()">
            <svg class="cts__add__icon" ng-if="!self.showAddMessageContent">
                <use xlink:href="#ico36_plus" href="#ico36_plus"></use>
            </svg>
            <svg class="cts__add__icon" ng-if="self.showAddMessageContent">
                <use xlink:href="#ico36_close" href="#ico36_close"></use>
            </svg>
        </button>
        <textarea 
            won-textarea-autogrow
            data-min-rows="1"
            data-max-rows="4"
            class="cts__text won-txt"
            ng-class="{'won-txt--code': self.isCode, 'won-txt--valid' : self.belowMaxLength(), 'won-txt--invalid' : !self.belowMaxLength() }"
            tabindex="0"
            placeholder="{{self.placeholder}}"></textarea>

        <button
            class="cts__submitbutton red"
            ng-show="self.submitButtonLabel"
            ng-click="self.submit()"
            ng-disabled="!self.valid()">
            {{ (self.submitButtonLabel || 'Submit') }}
        </button>
        <div class="cts__additionalcontent" ng-if="self.hasAdditionalContent() || self.hasReferencedContent()">
          <div class="cts__additionalcontent__header">Additional Content to send:</div>
          <div class="cts__additionalcontent__list">
            <div class="cts__additionalcontent__list__item" ng-repeat="ref in self.getReferencedContentKeysArray()">
              <svg class="cts__additionalcontent__list__item__icon clickable"
                ng-click="self.activateMultiSelect(ref)">
                <use xlink:href="#ico36_plus" href="#ico36_plus"></use>
              </svg>
              <span class="cts__additionalcontent__list__item__label clickable"
                ng-click="self.activateMultiSelect(ref)">
                {{ self.getHumanReadableReferencedContent(ref) }}
              </span>
              <svg class="cts__additionalcontent__list__item__discard clickable"
                ng-click="self.removeReferencedContent(ref)">
                <use xlink:href="#ico36_close" href="#ico36_close"></use>
              </svg>
            </div>
            <div class="cts__additionalcontent__list__item" ng-repeat="key in self.getAdditionalContentKeysArray()">
              <svg class="cts__additionalcontent__list__item__icon clickable"
                ng-click="self.pickDetail(self.allDetails[key])">
                <use xlink:href={{self.allDetails[key].icon}} href={{self.allDetails[key].icon}}></use>
              </svg>
              <span class="cts__additionalcontent__list__item__label clickable"
                ng-click="self.pickDetail(self.allDetails[key])">
                {{ self.getHumanReadableString(key, self.additionalContent.get(key)) }}
              </span>
              <svg class="cts__additionalcontent__list__item__discard clickable"
                ng-click="self.updateDetail(key, undefined, true)">
                <use xlink:href="#ico36_close" href="#ico36_close"></use>
              </svg>
            </div>
          </div>
        </div>
        <div class="cts__charcount" ng-show="self.maxChars">
            {{ self.charactersLeft() }} characters left
        </div>

        <div class="cts__helptext" ng-show="self.helpText">
            {{ self.helpText }}
        </div>
    `;

  const serviceDependencies = [
    "$scope",
    "$element",
    "$ngRedux" /*injections as strings here*/,
  ];

  class Controller {
    constructor(/* arguments <- serviceDependencies */) {
      attach(this, serviceDependencies, arguments);
      window.ctfs4dbg = this;
      this.allDetails = getAllDetails();

      this.draftObject = {};
      this.additionalContent = new Map(); //Stores the additional Detail content of a message
      this.referencedContent = new Map(); //Stores the reference Content of a message (e.g. proposes, retracts...)

      const selectFromState = state => {
        const connectionUri = selectOpenConnectionUri(state);
        const post =
          connectionUri && selectNeedByConnectionUri(state, connectionUri);
        const connection = post && post.getIn(["connections", connectionUri]);
        const connectionState = connection && connection.get("state");

        const chatMessages = connection && connection.get("messages");
        const selectedMessages =
          chatMessages && chatMessages.filter(msg => msg.get("isSelected"));

        const selectedDetailIdentifier = state.get("selectedAddMessageContent");
        const selectedDetail =
          this.allDetails &&
          selectedDetailIdentifier &&
          this.allDetails[selectedDetailIdentifier];
        return {
          connectionUri,
          post,
          multiSelectType: connection && connection.get("multiSelectType"),
          showAgreementData: connection && connection.get("showAgreementData"),
          isConnected: connectionState && connectionState === won.WON.Connected,
          selectedMessages,
          connectionHasBeenLost:
            state.getIn(["messages", "reconnecting"]) ||
            state.getIn(["messages", "lostConnection"]),
          showAddMessageContent: state.get("showAddMessageContent"),
          selectedDetail,
          selectedDetailComponent: selectedDetail && selectedDetail.component,
        };
      };

      const disconnect = this.$ngRedux.connect(selectFromState, actionCreators)(
        this
      );
      this.$scope.$on("$destroy", disconnect);

      this.textFieldNg().bind("input", () => {
        this.input();
        return false;
      });
      this.textFieldNg().bind("paste", () => {
        this.paste();
      });
      this.textFieldNg().bind("keydown", e => {
        this.keydown(e);
        return false;
      });
    }
    keydown(e) {
      if (e.keyCode === 13 && !e.shiftKey) {
        e.preventDefault(); // prevent a newline from being entered
        this.submit();
        return false;
      }
    }
    paste() {
      const payload = {
        value: this.value(),
        valid: this.valid(),
      };
      this.onPaste(payload);
      dispatchEvent(this.$element[0], "paste", payload);
    }
    input() {
      const payload = {
        value: this.value(),
        valid: this.valid(),
      };
      this.onInput(payload);
      dispatchEvent(this.$element[0], "input", payload);

      /* trigger digest so button and counter update
             * delay is because submit triggers an input-event
             * and is in a digest-cycle already. opposed to user-
             * triggered input-events. dunno why the latter doesn't
             * do that tho.
             */
      delay(0).then(() => this.$scope.$digest());
    }
    submit() {
      const value = this.value();
      const valid = this.valid();
      if (valid) {
        const txtEl = this.textField();
        if (txtEl) {
          txtEl.value = "";
          txtEl.dispatchEvent(new Event("input")); // dispatch input event so autoresizer notices value-change
          txtEl.focus(); //refocus so people can keep writing
        }
        const payload = {
          value,
          valid,
          additionalContent: this.additionalContent,
        };
        if (this.additionalContent) {
          this.additionalContent = new Map();
        }
        this.onSubmit(payload);
        dispatchEvent(this.$element[0], "submit", payload);
      }
    }
    charactersLeft() {
      return this.maxChars - this.value().length;
    }
    belowMaxLength() {
      return !this.maxChars || this.charactersLeft() >= 0;
    }
    valid() {
      return (
        !this.connectionHasBeenLost &&
        (this.allowEmptySubmit ||
          this.hasAdditionalContent() ||
          this.hasReferencedContent() ||
          this.value().length > 0) &&
        this.belowMaxLength()
      );
    }
    value() {
      const txtEl = this.textField();
      if (txtEl) {
        return txtEl.value.trim();
      }
    }

    textFieldNg() {
      return angular.element(this.textField());
    }
    textField() {
      if (!this._textField) {
        this._textField = this.$element[0].querySelector(".cts__text");
      }
      return this._textField;
    }
    pickDetail(detail) {
      this.selectAddMessageContent({ selectedDetail: detail.identifier });
    }

    updateDetail(name, value, closeOnDelete = false) {
      if (!value) {
        this.additionalContent.delete(name);
        if (closeOnDelete) {
          this.hideAddMessageContentDisplay();
        }
      } else {
        this.additionalContent.set(name, value);
      }
    }

    hasAdditionalContent() {
      return this.additionalContent && this.additionalContent.size > 0;
    }

    hasReferencedContent() {
      return this.referencedContent && this.referencedContent.size > 0;
    }

    getAdditionalContentKeysArray() {
      return (
        this.additionalContent &&
        this.additionalContent.keys() &&
        Array.from(this.additionalContent.keys())
      );
    }

    getReferencedContentKeysArray() {
      return (
        this.referencedContent &&
        this.referencedContent.keys() &&
        Array.from(this.referencedContent.keys())
      );
    }

    getHumanReadableString(key, value) {
      const usedDetail = this.allDetails[key];

      return (
        usedDetail &&
        usedDetail.generateHumanReadable({ value: value, includeLabel: true })
      );
    }

    activateMultiSelect(type) {
      this.cancelMultiSelect(); //close the multiselection if its already open

      this.connections__setMultiSelectType({
        connectionUri: this.connectionUri,
        multiSelectType: type,
      });

      const referencedContent =
        this.referencedContent && this.referencedContent.get(type);
      if (referencedContent) {
        referencedContent.forEach(msg => {
          this.messages__setMessageSelected({
            messageUri: msg.get("uri"),
            connectionUri: this.connectionUri,
            needUri: this.post.get("uri"),
            isSelected: true,
          });
        });
      }
    }

    getMultiSelectActionLabel() {
      if (this.multiSelectType) {
        switch (this.multiSelectType) {
          case "rejects":
            return "Reject selected";
          case "retracts":
            return "Retract selected";
          case "proposes":
            return "Propose selected";
          case "accepts":
            return "Accept selected";
          case "proposesToCancel":
            return "Propose To Cancel selected";
          default:
            return "illegal state";
        }
      }
    }

    cancelMultiSelect() {
      this.connections__setMultiSelectType({
        connectionUri: this.connectionUri,
        multiSelectType: undefined,
      });
    }

    saveReferencedContent() {
      this.referencedContent.set(this.multiSelectType, this.selectedMessages);
      this.cancelMultiSelect();
    }

    removeReferencedContent(ref = this.multiSelectType) {
      this.referencedContent.delete(ref);
      this.cancelMultiSelect();
    }

    getHumanReadableReferencedContent(ref) {
      const referencedMessages = this.referencedContent.get(ref);
      const referencedMessagesSize = referencedMessages
        ? referencedMessages.size
        : 0;

      let humanReadableReferenceString = "";

      switch (ref) {
        case "rejects":
          humanReadableReferenceString = "Reject ";
          break;
        case "retracts":
          humanReadableReferenceString = "Retract ";
          break;
        case "proposes":
          humanReadableReferenceString = "Propose ";
          break;
        case "accepts":
          humanReadableReferenceString = "Accept ";
          break;
        case "proposesToCancel":
          humanReadableReferenceString = "Propose To Cancel ";
          break;
        default:
          return "illegal state";
      }

      humanReadableReferenceString +=
        referencedMessagesSize +
        (referencedMessagesSize > 1 ? " Messages" : " Message");
      return humanReadableReferenceString;
    }
  }
  Controller.$inject = serviceDependencies;

  return {
    restrict: "E",
    controller: Controller,
    controllerAs: "self",
    bindToController: true, //scope-bindings -> ctrl
    scope: {
      placeholder: "=", // NOTE: bound only once
      maxChars: "=",
      helpText: "=",

      isCode: "=", // whether or not the text is code and e.g. should use monospace
      allowDetails: "=", //whether or not it is allowed to add content other than text

      allowEmptySubmit: "=", // allows submitting empty messages

      /*
             * Usage:
             *  on-input="::myCallback(value, valid)"
             */
      onInput: "&",
      /*
             * Usage:
             *  on-paste="::myCallback(value, valid)"
             */
      onPaste: "&",

      submitButtonLabel: "=",
      /*
             * Usage:
             *  on-submit="::myCallback(value)"
             */
      onSubmit: "&",
    },
    template: template,
  };
}

export default angular
  .module("won.owner.components.chatTextfieldSimple", [
    labelledHrModule,
    autoresizingTextareaModule,
    descriptionPickerModule,
    locationPickerModule,
    personPickerModule,
    travelActionPickerModule,
    tagsPickerModule,
    titlePickerModule,
    numberPickerModule,
    datePickerModule,
    timePickerModule,
    datetimePickerModule,
    monthPickerModule,
    ttlPickerModule,
    dropdownPickerModule,
    selectPickerModule,
    rangePickerModule,
    ngAnimate,
  ])
  .directive("messageDetailElement", [
    "$compile",
    function($compile) {
      return {
        restrict: "A",
        scope: {
          onUpdate: "&",
          initialValue: "=",
          identifier: "=",
          detail: "=",
        },
        link: function(scope, element, attrs) {
          const customTag = attrs.messageDetailElement;
          if (!customTag) return;

          const customElem = angular.element(
            `<${customTag} initial-value="initialValue" on-update="internalUpdate(value)" detail="detail"></${customTag}>`
          );

          scope.internalUpdate = function(value) {
            scope.onUpdate({
              identifier: scope.identifier,
              value: value,
            });
          };
          element.append($compile(customElem)(scope));
        },
      };
    },
  ])
  .directive("chatTextfieldSimple", genComponentConf).name;
