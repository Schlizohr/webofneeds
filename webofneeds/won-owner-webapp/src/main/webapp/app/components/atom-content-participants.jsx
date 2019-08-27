/**
 * Created by quasarchimaere on 30.07.2019.
 */
import React from "react";
import { get, getIn } from "../utils.js";
import { actionCreators } from "../actions/actions.js";
import { connect } from "react-redux";
import * as atomUtils from "../redux/utils/atom-utils";
import * as generalSelectors from "../redux/selectors/general-selectors";
import * as connectionSelectors from "../redux/selectors/connection-selectors";
import * as connectionUtils from "../redux/utils/connection-utils";
import won from "../won-es6";
import WonLabelledHr from "./labelled-hr.jsx";
import WonSuggestAtomPicker from "./details/picker/suggest-atom-picker.jsx";
import WonAtomCard from "./atom-card.jsx";

import "~/style/_atom-content-participants.scss";
import VisibilitySensor from "react-visibility-sensor";
import PropTypes from "prop-types";

const mapStateToProps = (state, ownProps) => {
  const post = getIn(state, ["atoms", ownProps.atomUri]);
  const isOwned = generalSelectors.isAtomOwned(state, ownProps.atomUri);

  const hasGroupSocket = atomUtils.hasGroupSocket(post);

  const groupMembers = hasGroupSocket && get(post, "groupMembers");
  const groupChatConnections =
    isOwned &&
    hasGroupSocket &&
    connectionSelectors.getGroupChatConnectionsByAtomUri(
      state,
      ownProps.atomUri
    );

  let excludedFromInviteUris = [ownProps.atomUri];

  if (groupChatConnections) {
    groupChatConnections
      .filter(conn => !connectionUtils.isClosed(conn))
      .map(conn => excludedFromInviteUris.push(get(conn, "targetAtomUri")));
  }

  return {
    atomUri: ownProps.atomUri,
    isOwned,
    hasGroupSocket,
    groupMembers: groupMembers && groupMembers.size > 0,
    hasGroupChatConnections:
      groupChatConnections && groupChatConnections.size > 0,
    groupChatConnectionsArray:
      groupChatConnections && groupChatConnections.toArray(),
    excludedFromInviteUris,
    groupMembersArray: groupMembers && groupMembers.toArray(),
    currentLocation: generalSelectors.getCurrentLocation(state),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    connectionMarkAsRead: (connectionUri, atomUri) => {
      dispatch(
        actionCreators.connections__markAsRead({
          connectionUri: connectionUri,
          atomUri: atomUri,
        })
      );
    },
    hideModalDialog: () => {
      dispatch(actionCreators.view__hideModalDialog());
    },
    showModalDialog: payload => {
      dispatch(actionCreators.view__showModalDialog(payload));
    },
    connect: (ownedAtomUri, connectionUri, targetAtomUri, message) => {
      dispatch(
        actionCreators.atoms__connect(
          ownedAtomUri,
          connectionUri,
          targetAtomUri,
          message
        )
      );
    },
    connectionClose: connectionUri => {
      dispatch(actionCreators.connections__close(connectionUri));
    },
    connectionOpen: (connectionUri, message) => {
      dispatch(actionCreators.connections__open(connectionUri, message));
    },
    rateConnection: (connectionUri, rating) => {
      dispatch(actionCreators.connections__rate(connectionUri, rating));
    },
  };
};

class WonAtomContentParticipants extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      suggestAtomExpanded: false,
    };
    this.toggleSuggestions = this.toggleSuggestions.bind(this);
  }

  toggleSuggestions() {
    this.setState({ suggestAtomExpanded: !this.state.suggestAtomExpanded });
  }

  render() {
    let participants;

    if (this.props.isOwned) {
      if (this.props.hasGroupChatConnections) {
        participants = this.props.groupChatConnectionsArray.map(conn => {
          if (!connectionUtils.isClosed(conn)) {
            let actionButtons;

            if (connectionUtils.isRequestReceived(conn)) {
              actionButtons = (
                <div className="acp__participant__actions">
                  <button
                    className="acp__participant__actions__button red won-button--outlined thin"
                    onClick={() => this.openRequest(conn)}
                  >
                    Accept
                  </button>
                  <button
                    className="acp__participant__actions__button red won-button--outlined thin"
                    onClick={() =>
                      this.closeConnection(conn, "Reject Participant Request?")
                    }
                  >
                    Reject
                  </button>
                </div>
              );
            } else if (connectionUtils.isSuggested(conn)) {
              actionButtons = (
                <div className="acp__participant__actions">
                  <button
                    className="acp__participant__actions__button red won-button--outlined thin"
                    onClick={() => this.sendRequest(conn)}
                  >
                    Request
                  </button>
                  <button
                    className="acp__participant__actions__button red won-button--outlined thin"
                    onClick={() =>
                      this.closeConnection(
                        conn,
                        "Remove Participant Suggestion?"
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              );
            } else if (connectionUtils.isRequestSent(conn)) {
              actionButtons = (
                <div className="acp__participant__actions">
                  <button
                    className="acp__participant__actions__button red won-button--outlined thin"
                    disabled={true}
                  >
                    Waiting for Accept...
                  </button>
                  <button
                    className="acp__participant__actions__button red won-button--outlined thin"
                    onClick={() =>
                      this.closeConnection(conn, "Cancel Participant Request?")
                    }
                  >
                    Cancel
                  </button>
                </div>
              );
            } else if (connectionUtils.isConnected(conn)) {
              actionButtons = (
                <div className="acp__participant__actions">
                  <button
                    className="acp__participant__actions__button red won-button--outlined thin"
                    onClick={() => this.closeConnection(conn)}
                  >
                    Remove
                  </button>
                </div>
              );
            } else {
              actionButtons = <div className="acp__participant__actions" />;
            }

            return (
              <VisibilitySensor
                key={get(conn, "uri")}
                onChange={isVisible => {
                  isVisible &&
                    connectionUtils.isUnread(conn) &&
                    this.markAsRead(conn);
                }}
                intervalDelay={2000}
              >
                <div
                  className={
                    "acp__participant " +
                    (connectionUtils.isUnread(conn) ? " won-unread " : "")
                  }
                >
                  <WonAtomCard
                    atomUri={get(conn, "targetAtomUri")}
                    currentLocation={this.props.currentLocation}
                    showSuggestions={false}
                    showPersona={true}
                  />
                  {actionButtons}
                </div>
              </VisibilitySensor>
            );
          }
        });
      } else {
        participants = (
          <div className="acp__empty">No Groupmembers present.</div>
        );
      }

      return (
        <won-atom-content-participants>
          {participants}
          <WonLabelledHr
            label="Invite"
            arrow={this.state.suggestAtomExpanded ? "up" : "down"}
            onClick={this.toggleSuggestions}
          />
          {this.state.suggestAtomExpanded ? (
            <WonSuggestAtomPicker
              initialValue={undefined}
              onUpdate={({ value }) => this.inviteParticipant(value)}
              detail={{ placeholder: "Insert AtomUri to invite" }}
              excludedUris={this.props.excludedFromInviteUris}
              allowedSockets={[
                won.CHAT.ChatSocketCompacted,
                won.GROUP.GroupSocketCompacted,
              ]}
              excludedText="Invitation does not work for atoms that are already part of the Group, or the group itself"
              notAllowedSocketText="Invitation does not work on atoms without Group or Chat Socket"
              noSuggestionsText="No Participants available to invite"
            />
          ) : (
            undefined
          )}
        </won-atom-content-participants>
      );
    } else {
      if (this.props.groupMembers) {
        participants = this.props.groupMembersArray.map(memberUri => {
          return (
            <div className="acp__participant" key={memberUri}>
              <WonAtomCard
                atomUri={memberUri}
                currentLocation={this.props.currentLocation}
                showSuggestions={false}
                showPersona={true}
              />
              <div className="acp__participant__actions" />
            </div>
          );
        });
      } else {
        participants = (
          <div className="acp__empty">No Groupmembers present.</div>
        );
      }

      return (
        <won-atom-content-participants>
          {participants}
        </won-atom-content-participants>
      );
    }
  }

  closeConnection(conn, dialogText = "Remove Participant?") {
    if (!conn) {
      return;
    }

    const payload = {
      caption: "Group",
      text: dialogText,
      buttons: [
        {
          caption: "Yes",
          callback: () => {
            const connUri = get(conn, "uri");

            if (connectionUtils.isUnread(conn)) {
              this.props.connectionMarkAsRead(connUri, this.props.atomUri);
            }

            this.props.connectionClose(connUri);
            this.props.hideModalDialog();
          },
        },
        {
          caption: "No",
          callback: () => {
            this.props.hideModalDialog();
          },
        },
      ],
    };
    this.props.showModalDialog(payload);
  }

  openRequest(conn, message = "") {
    if (!conn) {
      return;
    }

    const connUri = get(conn, "uri");

    if (connectionUtils.isUnread(conn)) {
      this.props.connectionMarkAsRead(connUri, this.props.atomUri);
    }

    this.props.connectionOpen(connUri, message);
  }

  sendRequest(conn, message = "") {
    if (!conn) {
      return;
    }

    const payload = {
      caption: "Group",
      text: "Add as Participant?",
      buttons: [
        {
          caption: "Yes",
          callback: () => {
            const connUri = get(conn, "uri");
            const targetAtomUri = get(conn, "targetAtomUri");

            if (connectionUtils.isUnread(conn)) {
              this.props.connectionMarkAsRead(connUri, this.props.atomUri);
            }

            this.props.rateConnection(connUri, won.WONCON.binaryRatingGood);
            this.props.connect(
              this.props.atomUri,
              connUri,
              targetAtomUri,
              message
            );
            this.props.hideModalDialog();
          },
        },
        {
          caption: "No",
          callback: () => {
            this.props.hideModalDialog();
          },
        },
      ],
    };
    this.props.showModalDialog(payload);
  }

  inviteParticipant(atomUri, message = "") {
    if (!this.props.isOwned || !this.props.hasGroupSocket) {
      console.warn("Trying to invite to a non-owned or non groupSocket atom");
      return;
    }

    const payload = {
      caption: "Group",
      text: "Invite as Participant?",
      buttons: [
        {
          caption: "Yes",
          callback: () => {
            this.props.connect(this.props.atomUri, undefined, atomUri, message);
            this.props.hideModalDialog();
          },
        },
        {
          caption: "No",
          callback: () => {
            this.props.hideModalDialog();
          },
        },
      ],
    };
    this.props.showModalDialog(payload);
  }

  markAsRead(conn) {
    if (connectionUtils.isUnread(conn)) {
      this.props.connectionMarkAsRead(get(conn, "uri"), this.props.atomUri);
    }
  }
}
WonAtomContentParticipants.propTypes = {
  atomUri: PropTypes.string.isRequired,
  isOwned: PropTypes.bool,
  hasGroupSocket: PropTypes.bool,
  groupMembers: PropTypes.bool,
  hasGroupChatConnections: PropTypes.bool,
  groupChatConnectionsArray: PropTypes.arrayOf(PropTypes.object),
  excludedFromInviteUris: PropTypes.arrayOf(PropTypes.string),
  groupMembersArray: PropTypes.arrayOf(PropTypes.string),
  currentLocation: PropTypes.object,
  connectionMarkAsRead: PropTypes.func,
  hideModalDialog: PropTypes.func,
  showModalDialog: PropTypes.func,
  connect: PropTypes.func,
  connectionClose: PropTypes.func,
  connectionOpen: PropTypes.func,
  rateConnection: PropTypes.func,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WonAtomContentParticipants);
