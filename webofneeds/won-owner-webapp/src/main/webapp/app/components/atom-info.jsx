import React from "react";
import PropTypes from "prop-types";
import Immutable from "immutable";
import { connect } from "react-redux";
import { get, getIn } from "../utils.js";
import { actionCreators } from "../actions/actions.js";
import WonAtomHeaderBig from "./atom-header-big.jsx";
import WonAtomHeader from "../components/atom-header.jsx";
import WonAtomMenu from "./atom-menu.jsx";
import WonAtomContent from "./atom-content.jsx";
import ChatTextfield from "./chat-textfield.jsx";
import * as generalSelectors from "../redux/selectors/general-selectors";
import * as atomUtils from "../redux/utils/atom-utils";
import * as connectionUtils from "../redux/utils/connection-utils";
import * as viewUtils from "../redux/utils/view-utils";
import * as processSelectors from "../redux/selectors/process-selectors";
import * as accountUtils from "../redux/utils/account-utils";
import * as useCaseUtils from "../usecase-utils.js";
import won from "../won-es6.js";

import "~/style/_atom-info.scss";

const mapStateToProps = (state, ownProps) => {
  const atom = getIn(state, ["atoms", ownProps.atomUri]);

  const isOwned = generalSelectors.isAtomOwned(state, ownProps.atomUri);

  //checks for active and chatSocket || groupSocket
  const isConnectible = atomUtils.isConnectible(atom);
  const hasReactionUseCases = atomUtils.hasReactionUseCases(atom);
  const hasEnabledUseCases = atomUtils.hasEnabledUseCases(atom);

  const showEnabledUseCases = isConnectible && isOwned && hasEnabledUseCases;
  const showReactionUseCases = isConnectible && !isOwned && hasReactionUseCases;

  const showAdHocRequestField =
    !isOwned && isConnectible && !showEnabledUseCases && !showReactionUseCases;

  const viewState = get(state, "view");
  const visibleTab = viewUtils.getVisibleTabByAtomUri(
    viewState,
    ownProps.atomUri
  );

  const chatSocketUri = atomUtils.getSocketUri(
    atom,
    won.CHAT.ChatSocketCompacted
  );
  const groupSocketUri = atomUtils.getSocketUri(
    atom,
    won.GROUP.GroupSocketCompacted
  );

  const atomLoading =
    !atom || processSelectors.isAtomLoading(state, ownProps.atomUri);

  const holderUri = atomUtils.getHeldByUri(atom);

  const ownedAtoms = generalSelectors.getOwnedAtoms(state);

  const ownedChatSocketAtoms =
    ownedAtoms && ownedAtoms.filter(atom => atomUtils.hasChatSocket(atom));

  const reactionTypes = atomUtils.getReactionUseCases(atom).toArray();
  const ownedReactionAtoms =
    ownedChatSocketAtoms &&
    ownedChatSocketAtoms.filter(
      ownAtom =>
        reactionTypes &&
        reactionTypes.includes(atomUtils.getMatchedUseCaseIdentifier(ownAtom))
    );

  return {
    className: ownProps.className,
    atomUri: ownProps.atomUri,
    defaultTab: ownProps.defaultTab,
    loggedIn: accountUtils.isLoggedIn(get(state, "account")),
    isInactive: atomUtils.isInactive(atom),
    showAdHocRequestField,
    showEnabledUseCases,
    showReactionUseCases,
    reactionUseCasesArray: showReactionUseCases
      ? atomUtils.getReactionUseCases(atom).toArray()
      : [],
    ownedReactionAtomArray: ownedReactionAtoms
      ? ownedReactionAtoms.toArray()
      : [],
    enabledUseCasesArray: showEnabledUseCases
      ? atomUtils.getEnabledUseCases(atom).toArray()
      : [],
    atomLoading,
    showFooter:
      !atomLoading &&
      visibleTab === "DETAIL" &&
      (showEnabledUseCases || showReactionUseCases || showAdHocRequestField),
    addHolderUri: showEnabledUseCases ? holderUri : undefined,
    holderUri,
    chatSocketUri,
    groupSocketUri,
    ownedChatSocketAtoms,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    viewRemoveAddMessageContent: () => {
      dispatch(actionCreators.view__removeAddMessageContent());
    },
    routerGo: (path, props) => {
      dispatch(actionCreators.router__stateGo(path, props));
    },
    routerGoResetParams: path => {
      dispatch(actionCreators.router__stateGoResetParams(path));
    },
    hideModalDialog: () => {
      dispatch(actionCreators.view__hideModalDialog());
    },
    showTermsDialog: payload => {
      dispatch(actionCreators.view__showTermsDialog(payload));
    },
    connectionsConnectAdHoc: (
      connectToAtomUri,
      message,
      connectToSocketUri,
      persona
    ) => {
      dispatch(
        actionCreators.connections__connectAdHoc(
          connectToAtomUri,
          message,
          connectToSocketUri,
          persona
        )
      );
    },
    connect: (
      ownedAtomUri,
      connectionUri,
      targetAtomUri,
      message,
      ownSocket,
      targetSocket
    ) => {
      dispatch(
        actionCreators.atoms__connect(
          ownedAtomUri,
          connectionUri,
          targetAtomUri,
          message,
          ownSocket,
          targetSocket
        )
      );
    },
    sendChatMessage: (
      trimmedMsg,
      additionalContent,
      referencedContent,
      connectionUri,
      isTTL
    ) => {
      dispatch(
        actionCreators.connections__sendChatMessage(
          trimmedMsg,
          additionalContent,
          referencedContent,
          connectionUri,
          isTTL
        )
      );
    },
    connectionsOpen: (connectionUri, message) => {
      dispatch(actionCreators.connections__open(connectionUri, message));
    },
  };
};

class AtomInfo extends React.Component {
  render() {
    let footerElement;

    // TODO: identicons don't work
    // TODO: merge with reactionUseCaseElements
    // TODO: instead of multiple buttons, have one button with dropdown
    // TODO: use atom-header-thingy here, it's done already
    if (this.props.showFooter) {
      const ownReactionAtomElements =
        this.props.showReactionUseCases &&
        this.props.ownedReactionAtomArray &&
        this.props.ownedReactionAtomArray.map((atom, index) => {
          const label = atom && atom.get("humanReadable");
          //const identicon = atom && atom.get("identiconSvg");
          return (
            <WonAtomHeader
              key={label + "-" + index}
              atomUri={atom && get(atom, "uri")}
              hideTimestamp={true}
              onClick={() => this.sendRequest(atom)}
            />
          );
        });

      const reactionUseCaseElements =
        this.props.showReactionUseCases &&
        this.props.reactionUseCasesArray &&
        this.props.reactionUseCasesArray.map((ucIdentifier, index) =>
          this.getUseCaseTypeButton(ucIdentifier, index)
        );

      const enabledUseCaseElements =
        this.props.showEnabledUseCases &&
        this.props.enabledUseCasesArray &&
        this.props.enabledUseCasesArray.map((ucIdentifier, index) =>
          this.getUseCaseTypeButton(ucIdentifier, index)
        );

      footerElement = (
        <div className="atom-info__footer">
          {this.props.showAdHocRequestField && (
            <React.Fragment>
              {this.props.chatSocketUri && (
                <ChatTextfield
                  placeholder="Message (optional)"
                  allowEmptySubmit={true}
                  showPersonas={true}
                  submitButtonLabel="Ask&#160;to&#160;Chat"
                  onSubmit={({ value, selectedPersona }) =>
                    this.sendAdHocRequest(
                      value,
                      this.props.chatSocketUri,
                      selectedPersona && selectedPersona.personaId
                    )
                  }
                />
              )}
              {this.props.groupSocketUri && (
                <ChatTextfield
                  placeholder="Message (optional)"
                  allowEmptySubmit={true}
                  showPersonas={true}
                  submitButtonLabel="Join&#160;Group"
                  onSubmit={({ value, selectedPersona }) =>
                    this.sendAdHocRequest(
                      value,
                      this.props.groupSocketUri,
                      selectedPersona && selectedPersona.personaId
                    )
                  }
                />
              )}
            </React.Fragment>
          )}
          {ownReactionAtomElements}
          {reactionUseCaseElements}
          {enabledUseCaseElements}
          {this.props.isInactive && (
            <div className="atom-info__footer__infolabel">
              Atom is inactive, no requests allowed
            </div>
          )}
        </div>
      );
    }

    return (
      <won-atom-info
        class={
          (this.props.className ? this.props.className : "") +
          (this.props.atomLoading ? " won-is-loading " : "")
        }
      >
        <WonAtomHeaderBig atomUri={this.props.atomUri} />
        <WonAtomMenu
          atomUri={this.props.atomUri}
          defaultTab={this.props.defaultTab}
        />
        <WonAtomContent
          atomUri={this.props.atomUri}
          defaultTab={this.props.defaultTab}
        />
        {footerElement}
      </won-atom-info>
    );
  }

  getUseCaseTypeButton(ucIdentifier, index) {
    return (
      <button
        key={ucIdentifier + "-" + index}
        className="won-button--filled red atom-info__footer__button"
        onClick={() => this.selectUseCase(ucIdentifier)}
      >
        {useCaseUtils.getUseCaseIcon(ucIdentifier) && (
          <svg className="won-button-icon">
            <use
              xlinkHref={useCaseUtils.getUseCaseIcon(ucIdentifier)}
              href={useCaseUtils.getUseCaseIcon(ucIdentifier)}
            />
          </svg>
        )}
        <span>{useCaseUtils.getUseCaseLabel(ucIdentifier)}</span>
      </button>
    );
  }

  selectUseCase(ucIdentifier) {
    this.props.routerGo("create", {
      useCase: ucIdentifier,
      useCaseGroup: undefined,
      connectionUri: undefined,
      fromAtomUri: this.props.atomUri,
      viewConnUri: undefined,
      mode: "CONNECT",
      holderUri: this.props.addHolderUri ? this.props.holderUri : undefined,
    });
  }

  sendRequest(ownAtom) {
    if (!this.props.loggedIn) {
      // this should not happen as not logged in accounts don't have owned atoms
      console.warn("Tried to connect from owned atom while not logged in!");
      return;
    }

    const ownAtomUri = ownAtom.get("uri");
    const ownSocketType = atomUtils.hasChatSocket(ownAtom)
      ? won.CHAT.ChatSocketCompacted
      : atomUtils.hasGroupSocket(ownAtom)
        ? won.GROUP.GroupSocketCompacted
        : undefined;
    const otherSocketType = this.props.chatSocketUri
      ? won.CHAT.ChatSocketCompacted
      : this.props.groupSocketUri
        ? won.GROUP.GroupSocketCompacted
        : undefined;

    this.props.connect(
      ownAtomUri,
      undefined,
      this.props.atomUri,
      undefined,
      ownSocketType,
      otherSocketType
    );

    // redirect to chats view to show new connection
    // maybe this could be improved by opening the new connection
    this.props.routerGoResetParams("connections");
  }

  sendAdHocRequest(message, connectToSocketUri, personaUri) {
    const _atomUri = this.props.atomUri;

    if (this.props.loggedIn) {
      if (_atomUri) {
        const personaAtom = get(this.props.ownedChatSocketAtoms, personaUri);

        if (personaAtom) {
          const targetSocketType =
            connectToSocketUri === this.props.chatSocketUri
              ? won.CHAT.ChatSocketCompacted
              : won.GROUP.GroupSocketCompacted;

          // if the personaAtom already contains a chatSocket we will just use the persona as the Atom that connects
          const personaConnections = get(personaAtom, "connections")
            .filter(conn => get(conn, "targetAtomUri") === _atomUri)
            .filter(conn => get(conn, "targetSocketUri") === connectToSocketUri)
            .filter(
              conn =>
                get(conn, "socketUri") ===
                atomUtils.getSocketUri(
                  personaAtom,
                  won.CHAT.ChatSocketCompacted
                )
            );

          if (personaConnections.size == 0) {
            this.props.connect(
              personaUri,
              undefined,
              _atomUri,
              message,
              won.CHAT.ChatSocketCompacted,
              targetSocketType
            );
            this.props.routerGoResetParams("connections");
          } else if (personaConnections.size == 1) {
            const personaConnection = personaConnections.first();
            const personaConnectionUri = get(personaConnection, "uri");

            if (
              connectionUtils.isSuggested(personaConnection) ||
              connectionUtils.isClosed(personaConnection)
            ) {
              this.props.connect(
                personaUri,
                personaConnectionUri,
                _atomUri,
                message,
                won.CHAT.ChatSocketCompacted,
                targetSocketType
              );
            } else if (connectionUtils.isRequestSent(personaConnection)) {
              // Just go to the connection without sending another request
              /*
              //Send another Request with a new message if there is a message present
              this.props.connect(
                personaUri,
                personaConnectionUri,
                _atomUri,
                message,
                won.CHAT.ChatSocketCompacted,
                targetSocketType
              );
              */
            } else if (connectionUtils.isRequestReceived(personaConnection)) {
              this.props.connectionsOpen(personaConnectionUri, message);
            } else if (connectionUtils.isConnected(personaConnection)) {
              this.props.sendChatMessage(
                message,
                undefined,
                undefined,
                personaConnectionUri,
                false
              );
            }

            this.props.routerGo("connections", {
              connectionUri: personaConnectionUri,
            });
          } else {
            console.error(
              "more than one connection stored between two atoms that use the same exact sockets",
              personaAtom,
              connectToSocketUri
            );
          }
        } else {
          this.props.routerGoResetParams("connections");

          this.props.connectionsConnectAdHoc(
            _atomUri,
            message,
            connectToSocketUri,
            personaUri
          );
        }
      }
    } else {
      this.props.showTermsDialog(
        Immutable.fromJS({
          acceptCallback: () => {
            this.props.hideModalDialog();
            this.props.routerGoResetParams("connections");

            if (_atomUri) {
              this.props.connectionsConnectAdHoc(
                _atomUri,
                message,
                connectToSocketUri,
                personaUri
              );
            }
          },
          cancelCallback: () => {
            this.props.hideModalDialog();
          },
        })
      );
    }
  }
}

AtomInfo.propTypes = {
  atomUri: PropTypes.string,
  defaultTab: PropTypes.string,
  loggedIn: PropTypes.bool,
  isInactive: PropTypes.bool,
  showAdHocRequestField: PropTypes.bool,
  showEnabledUseCases: PropTypes.bool,
  showReactionUseCases: PropTypes.bool,
  reactionUseCasesArray: PropTypes.arrayOf(PropTypes.object),
  enabledUseCasesArray: PropTypes.arrayOf(PropTypes.object),
  ownedReactionAtomArray: PropTypes.arrayOf(PropTypes.object),
  atomLoading: PropTypes.bool,
  showFooter: PropTypes.bool,
  addHolderUri: PropTypes.string,
  holderUri: PropTypes.string,
  className: PropTypes.string,
  routerGo: PropTypes.func,
  routerGoResetParams: PropTypes.func,
  hideModalDialog: PropTypes.func,
  showTermsDialog: PropTypes.func,
  connectionsConnectAdHoc: PropTypes.func,
  ownedChatSocketAtoms: PropTypes.func,
  chatSocketUri: PropTypes.string,
  groupSocketUri: PropTypes.string,
  connect: PropTypes.func,
  connectionsOpen: PropTypes.func,
  sendChatMessage: PropTypes.func,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AtomInfo);
