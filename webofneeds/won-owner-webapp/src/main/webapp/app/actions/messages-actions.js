/**
 * Created by ksinger on 19.02.2016.
 */

import won from "../won-es6.js";
import { actionTypes, actionCreators } from "./actions.js";
import { getIn } from "../utils.js";

import Immutable from "immutable";
import * as generalSelectors from "../redux/selectors/general-selectors.js";

import {
  isFetchMessageEffectsNeeded,
  buildChatMessage,
} from "../won-message-utils.js";
import * as stateStore from "../redux/state-store.js";
import * as atomUtils from "../redux/utils/atom-utils.js";
import * as ownerApi from "../api/owner-api.js";
import { get } from "../utils";
import * as processUtils from "../redux/utils/process-utils";

export function successfulCloseAtom(event) {
  return (dispatch, getState) => {
    //TODO MAYBE DELETE THIS FUNCTION, I THINK IT SERVES NO PURPOSE
    //TODO maybe refactor these response message handling
    if (
      getState().getIn([
        "messages",
        "waitingForAnswer",
        event.getIsRemoteResponseTo(),
      ])
    ) {
      //dispatch(actionCreators.connections__denied(event));
    }
  };
}
export function successfulReopenAtom(event) {
  return (dispatch, getState) => {
    //TODO MAYBE DELETE THIS FUNCTION, I THINK IT SERVES NO PURPOSE
    //TODO maybe refactor these response message handling
    if (
      getState().getIn([
        "messages",
        "waitingForAnswer",
        event.getIsRemoteResponseTo(),
      ])
    ) {
      //dispatch(actionCreators.connections__denied(event));
    }
  };
}
export function failedCloseAtom(event) {
  return (dispatch, getState) => {
    const atomUri = event.getRecipientAtom();

    won
      .clearStoreWithPromise()
      .then(() =>
        stateStore.fetchDataForOwnedAtoms([atomUri], dispatch, getState)
      )
      .then(() => dispatch({ type: actionTypes.messages.closeAtom.failed }));
  };
}

export function failedReopenAtom(event) {
  return (dispatch, getState) => {
    const atomUri = event.getRecipientAtom();

    won
      .clearStoreWithPromise()
      .then(() =>
        stateStore.fetchDataForOwnedAtoms([atomUri], dispatch, getState)
      )
      .then(() => dispatch({ type: actionTypes.messages.reopenAtom.failed }));
  };
}

/*
         recipientAtom: "https://192.168.124.53:8443/won/resource/atom/1741189480636743700"
         senderAtom: "https://192.168.124.53:8443/won/resource/atom/1741189480636743700"
         has....Connection
         event.uri


         won.WONMSG.recipientAtom = won.WONMSG.baseUri + "recipientAtom";
         won.WONMSG.recipientAtomCompacted = won.WONMSG.prefix + ":recipientAtom";
         won.WONMSG.recipient = won.WONMSG.baseUri + "recipient"; // connection if connection event
         won.WONMSG.recipientCompacted = won.WONMSG.prefix + ":recipient";
         won.WONMSG.recipientNode = won.WONMSG.baseUri + "recipientNode";
         won.WONMSG.recipientNodeCompacted = won.WONMSG.prefix + ":recipientNode";
         won.WONMSG.senderAtom = won.WONMSG.baseUri + "senderAtom";
         won.WONMSG.senderAtomCompacted = won.WONMSG.prefix + ":senderAtom";
         won.WONMSG.sender = won.WONMSG.baseUri + "sender";
         won.WONMSG.senderCompacted = won.WONMSG.prefix + ":sender";
         won.WONMSG.senderNode = won.WONMSG.baseUri + "senderNode";
         won.WONMSG.senderNodeCompacted = won.WONMSG.prefix + ":senderNode";
         */

export function successfulCloseConnection(event) {
  return (dispatch, getState) => {
    const state = getState();
    //TODO maybe refactor these response message handling
    if (
      state.getIn(["messages", "waitingForAnswer", event.getIsResponseTo()])
    ) {
      dispatch({
        type: actionTypes.messages.close.success,
        payload: event,
      });
    } else if (
      state.getIn([
        "messages",
        "waitingForAnswer",
        event.getIsRemoteResponseTo(),
      ])
    ) {
      dispatch({
        type: actionTypes.messages.close.success,
        payload: event,
      });
    } else {
      //when a connection is closed by the node (e.g. when you close/deactivate an atom all its corresponding connections will be closed)
      dispatch({
        type: actionTypes.messages.close.success,
        payload: event,
      });
    }
  };
}

export function successfulCreate(event) {
  return dispatch => {
    //const state = getState();
    //TODO: if negative, use alternative atom URI and send again
    //fetch atom data and store in local RDF store
    //get URI of newly created atom from message

    //load the data into the local rdf store and publish AtomCreatedEvent when done
    const atomURI = event.getAtom();

    won.getAtom(atomURI).then(atom => {
      dispatch(
        actionCreators.atoms__createSuccessful({
          eventUri: event.getIsResponseTo(),
          atomUri: event.getAtom(),
          atom: atom,
        })
      );
    });
  };
}

export function successfulEdit(event) {
  return (dispatch, getState) => {
    console.debug("Received success replace message:", event);
    //const state = getState();
    //load the edited data into the local rdf store and publish AtomEditEvent when done
    const atomURI = event.getAtom();

    const processState = get(getState(), "process");

    if (processUtils.isAtomLoading(processState, atomURI)) {
      console.debug(
        "successfulEdit: Atom is currently loading DO NOT FETCH AGAIN"
      );
    } else {
      won
        .clearStoreWithPromise()
        .then(() =>
          stateStore.fetchDataForOwnedAtoms([atomURI], dispatch, getState)
        )
        .then(() => {
          dispatch(
            actionCreators.atoms__editSuccessful({
              eventUri: event.getIsResponseTo(),
              atomUri: event.getAtom(),
              //atom: atom,
            })
          );
        });
    }
  };
}

export function processOpenMessage(event) {
  return (dispatch, getState) => {
    const recipientAtomUri = event.getRecipientAtom();
    const receiverConnectionUri = event.getRecipientConnection();

    const senderAtomUri = event.getSenderAtom();
    const senderConnectionUri = event.getSenderConnection();

    const state = getState();
    const senderAtom = getIn(state, ["atoms", senderAtomUri]);
    const recipientAtom = getIn(state, ["atoms", recipientAtomUri]);

    const isOwnSenderAtom = generalSelectors.isAtomOwned(state, senderAtomUri);
    const isOwnRecipientAtom = generalSelectors.isAtomOwned(
      state,
      recipientAtomUri
    );

    //check if the two connections are relevant to be stored within the state (if connUri is present, and if Atom belongs to self)
    const isSenderConnectionRelevant = senderConnectionUri && isOwnSenderAtom;
    const isReceiverConnectionRelevant =
      receiverConnectionUri && isOwnRecipientAtom;

    let senderAtomP;
    if (isOwnSenderAtom) {
      //We know that all own atoms are already stored within the state, so we do not have to retrieve it
      senderAtomP = Promise.resolve(true);
    } else {
      senderAtomP = stateStore.fetchAtomAndDispatch(
        senderAtomUri,
        dispatch,
        getState
      );
    }

    let recipientAtomP;
    if (isOwnRecipientAtom) {
      //We know that all own atoms are already stored within the state, so we do not have to retrieve it
      recipientAtomP = Promise.resolve(true);
    } else {
      recipientAtomP = stateStore.fetchAtomAndDispatch(
        recipientAtomUri,
        dispatch,
        getState
      );
    }

    let senderConnectionP;
    if (!isSenderConnectionRelevant) {
      console.debug(
        "senderConnection not relevant, resolve with false -> ignore the connection"
      );
      senderConnectionP = Promise.resolve(false);
    } else if (getIn(senderAtom, ["connections", senderConnectionUri])) {
      console.debug(
        "senderConnection relevant, resolve with true -> handle the connection"
      );
      senderConnectionP = Promise.resolve(true);
    } else {
      senderConnectionP = stateStore
        .fetchActiveConnectionAndDispatch(
          senderConnectionUri,
          senderAtomUri,
          dispatch
        )
        .then(() => true);
    }

    let receiverConnectionP;
    if (!isReceiverConnectionRelevant) {
      console.debug(
        "receiverConnection not relevant, resolve with false -> ignore the connection"
      );
      receiverConnectionP = Promise.resolve(false);
    } else if (getIn(recipientAtom, ["connections", receiverConnectionUri])) {
      console.debug(
        "receiverConnection relevant, resolve with true -> handle the connection"
      );
      receiverConnectionP = Promise.resolve(true);
    } else {
      receiverConnectionP = stateStore
        .fetchActiveConnectionAndDispatch(
          receiverConnectionUri,
          recipientAtomUri,
          dispatch
        )
        .then(() => true);
    }

    Promise.all([
      senderConnectionP,
      receiverConnectionP,
      senderAtomP,
      recipientAtomP,
    ]).then(
      ([
        senderConnectionRelevant,
        receiverConnectionRelevant,
        senderAtom,
        recipientAtom,
      ]) => {
        if (receiverConnectionRelevant) {
          console.debug("Change ReceiverConnectionState ", recipientAtom);
          dispatch({
            type: actionTypes.messages.openMessageReceived,
            payload: {
              updatedConnectionUri: receiverConnectionUri,
              ownedAtomUri: recipientAtomUri,
              message: event,
            },
          });
        }

        if (senderConnectionRelevant) {
          console.debug("Change SenderConnectionState ", senderAtom);
          dispatch({
            type: actionTypes.messages.openMessageSent,
            payload: {
              senderConnectionUri: senderConnectionUri,
              senderAtomUri: senderAtomUri,
              event: event,
            },
          });
        }
      }
    );
  };
}

export function processAgreementMessage(event) {
  return dispatch => {
    dispatch({
      type: actionTypes.messages.processAgreementMessage,
      payload: event,
    });
  };
}

export function processChangeNotificationMessage(event) {
  return (dispatch, getState) => {
    const atomUriToLoad = event.getSenderAtom();

    /*
    Workaround, there is a possibility of a racecondition between the functions processChangeNotificationMessage, and successfulEdit
    e.g the atom could be fetched into the store twice or multiple times (e.g if an atom gets changed that has connections to multiple
    of your own needs, and thus the processChangeNotificationMessage would be called multiple times in a row. this way we ensure that
    there can only be one running fetch/storeClear at a time
    */
    const processState = get(getState(), "process");
    const isAtomLoading = processUtils.isAtomLoading(
      processState,
      atomUriToLoad
    );
    const isAtomProcessingUpdate = processUtils.isAtomProcessingUpdate(
      processState,
      atomUriToLoad
    );
    if (!isAtomLoading && !isAtomProcessingUpdate) {
      won
        .clearStoreWithPromise()
        .then(() =>
          stateStore.fetchAtomAndDispatch(
            atomUriToLoad,
            dispatch,
            getState,
            true
          )
        );
    } else {
      console.debug(
        "Omit fetch for processChangeNotificationMessage, fetch is currently in progress for atom: ",
        atomUriToLoad,
        " / isAtomLoading: ",
        isAtomLoading,
        "isAtomProcessingUpdate: ",
        isAtomProcessingUpdate
      );
    }

    dispatch({
      type: actionTypes.messages.processChangeNotificationMessage,
      payload: event,
    });
  };
}

export function processConnectionMessage(event) {
  return (dispatch, getState) => {
    if (isFetchMessageEffectsNeeded(event)) {
      const _atomUri = event.getSenderAtom();
      const isSentEvent = generalSelectors.isAtomOwned(getState(), _atomUri);

      let connectionUri;
      let atomUri;

      if (isSentEvent) {
        connectionUri = event.getSenderConnection();
        atomUri = event.getSenderAtom();
      } else {
        connectionUri = event.getRecipientConnection();
        atomUri = event.getRecipientAtom();
      }

      //PETRINET DATA PART START *********************
      dispatch({
        type: actionTypes.connections.setLoadingPetriNetData,
        payload: {
          connectionUri: connectionUri,
          loadingPetriNetData: true,
        },
      });

      ownerApi
        .getPetriNetUris(connectionUri)
        .then(response => {
          const petriNetData = {};

          response.forEach(entry => {
            if (entry.processURI) {
              petriNetData[entry.processURI] = entry;
            }
          });

          const petriNetDataImm = Immutable.fromJS(petriNetData);

          dispatch({
            type: actionTypes.connections.updatePetriNetData,
            payload: {
              connectionUri: connectionUri,
              petriNetData: petriNetDataImm,
            },
          });
        })
        .catch(error => {
          console.error("Error:", error);
          dispatch({
            type: actionTypes.connections.setLoadingPetriNetData,
            payload: {
              connectionUri: connectionUri,
              loadingPetriNetData: false,
            },
          });
        });

      //PETRINET DATA PART END **************************
      ownerApi
        .getMessageEffects(connectionUri, event.getMessageUri())
        .then(response => {
          for (const effect of response) {
            switch (effect.type) {
              case "ACCEPTS":
                if (effect.accepts) {
                  let acceptedMessageUris = Array.isArray(
                    effect.acceptedMessageUri
                  )
                    ? effect.acceptedMessageUri
                    : [effect.acceptedMessageUri];
                  acceptedMessageUris.forEach(acceptedMessageUri => {
                    dispatch({
                      type: actionTypes.messages.messageStatus.markAsAccepted,
                      payload: {
                        messageUri: acceptedMessageUri,
                        connectionUri: connectionUri,
                        atomUri: atomUri,
                        accepted: true,
                      },
                    });
                  });
                }
                break;
              case "CLAIMS":
                if (effect.claims) {
                  let claimedMessageUris = Array.isArray(effect.claims)
                    ? effect.claims
                    : [effect.claims];

                  claimedMessageUris.forEach(claimedMessageUri => {
                    dispatch({
                      type: actionTypes.messages.messageStatus.markAsClaimed,
                      payload: {
                        messageUri: claimedMessageUri,
                        connectionUri: connectionUri,
                        atomUri: atomUri,
                        claimed: true,
                      },
                    });
                  });
                }
                break;

              case "PROPOSES":
                if (effect.proposes) {
                  let proposedMessageUris = Array.isArray(effect.proposes)
                    ? effect.proposes
                    : [effect.proposes];

                  proposedMessageUris.forEach(proposedMessageUri => {
                    dispatch({
                      type: actionTypes.messages.messageStatus.markAsProposed,
                      payload: {
                        messageUri: proposedMessageUri,
                        connectionUri: connectionUri,
                        atomUri: atomUri,
                        proposed: true,
                      },
                    });
                  });
                }

                if (effect.proposalType === "CANCELS") {
                  let proposesToCancelUris = Array.isArray(
                    effect.proposesToCancel
                  )
                    ? effect.proposesToCancel
                    : [effect.proposesToCancel];

                  proposesToCancelUris.forEach(proposesToCancelURI => {
                    dispatch({
                      type:
                        actionTypes.messages.messageStatus
                          .markAsCancellationPending,
                      payload: {
                        messageUri: proposesToCancelURI,
                        connectionUri: connectionUri,
                        atomUri: atomUri,
                        cancellationPending: true,
                      },
                    });
                  });
                }
                break;

              case "REJECTS":
                if (effect.rejects) {
                  let rejectedMessageUris = Array.isArray(
                    effect.rejectedMessageUri
                  )
                    ? effect.rejectedMessageUri
                    : [effect.rejectedMessageUri];

                  rejectedMessageUris.forEach(rejectedMessageUri => {
                    dispatch({
                      type: actionTypes.messages.messageStatus.markAsRejected,
                      payload: {
                        messageUri: rejectedMessageUri,
                        connectionUri: connectionUri,
                        atomUri: atomUri,
                        rejected: true,
                      },
                    });
                  });
                }
                break;

              case "RETRACTS":
                if (effect.retracts) {
                  let retractedMessageUris = Array.isArray(
                    effect.retractedMessageUri
                  )
                    ? effect.retractedMessageUri
                    : [effect.retractedMessageUri];

                  retractedMessageUris.forEach(retractedMessageUri => {
                    dispatch({
                      type: actionTypes.messages.messageStatus.markAsRetracted,
                      payload: {
                        messageUri: retractedMessageUri,
                        connectionUri: connectionUri,
                        atomUri: atomUri,
                        retracted: true,
                      },
                    });
                  });
                }
                break;

              default:
                break;
            }
          }

          dispatch({
            type: actionTypes.messages.processConnectionMessage,
            payload: event,
          });
        });
    } else {
      dispatch({
        type: actionTypes.messages.processConnectionMessage,
        payload: event,
      });
    }
  };
}

export function processConnectMessage(event) {
  return (dispatch, getState) => {
    const senderSocketUri = event.getSenderSocket();
    const targetSocketUri = event.getTargetSocket();
    const state = getState();

    const recipientAtomUri = generalSelectors.getAtomUriBySocketUri(
      targetSocketUri
    );

    const senderAtomUri = generalSelectors.getAtomUriBySocketUri(
      senderSocketUri
    );

    const senderAtom = getIn(state, ["atoms", senderAtomUri]);
    const recipientAtom = getIn(state, ["atoms", recipientAtomUri]);
    const isOwnSenderAtom = generalSelectors.isAtomOwned(state, senderAtomUri);
    const isOwnRecipientAtom = generalSelectors.isAtomOwned(
      state,
      recipientAtomUri
    );

    const receiverConnectionUri = atomUtils.getConnectionUriBySocketUris(
      senderAtom,
      senderSocketUri,
      targetSocketUri
    );
    const senderConnectionUri = atomUtils.getConnectionUriBySocketUris(
      recipientAtom,
      targetSocketUri,
      senderSocketUri
    );

    let senderAtomP;
    if (isOwnSenderAtom) {
      //We know that all own atoms are already stored within the state, so we do not have to retrieve it
      senderAtomP = Promise.resolve(true);
    } else {
      senderAtomP = stateStore.fetchAtomAndDispatch(
        senderAtomUri,
        dispatch,
        getState
      );
    }

    let recipientAtomP;
    if (isOwnRecipientAtom) {
      //We know that all own atoms are already stored within the state, so we do not have to retrieve it
      recipientAtomP = Promise.resolve(true);
    } else {
      recipientAtomP = stateStore.fetchAtomAndDispatch(
        recipientAtomUri,
        dispatch,
        getState
      );
    }

    let senderCP;
    if (!senderConnectionUri || !isOwnSenderAtom) {
      console.debug(
        "senderConnectionUri was null or senderAtom is not ownedAtom, resolve promise with undefined -> ignore the connection"
      );
      senderCP = Promise.resolve(false);
    } else if (
      senderAtom &&
      senderAtom.getIn(["connections", senderConnectionUri])
    ) {
      console.debug(
        "senderConnection relevant, resolve with true -> handle the connection"
      );
      senderCP = Promise.resolve(true);
    } else {
      senderCP = stateStore
        .fetchActiveConnectionAndDispatch(
          senderConnectionUri,
          senderAtomUri,
          dispatch
        )
        .then(() => true);
    }

    let receiverCP;
    if (!receiverConnectionUri || !isOwnRecipientAtom) {
      console.debug(
        "receiverConnectionUri was null or recipientAtom is not ownedAtom, resolve promise with undefined -> ignore the connection"
      );
      receiverCP = Promise.resolve(false);
    } else if (
      recipientAtom &&
      recipientAtom.getIn(["connections", receiverConnectionUri])
    ) {
      console.debug(
        "receiverConnection relevant, resolve with true -> handle the connection"
      );
      receiverCP = Promise.resolve(true);
    } else {
      receiverCP = stateStore
        .fetchActiveConnectionAndDispatch(
          receiverConnectionUri,
          recipientAtomUri,
          dispatch
        )
        .then(() => true);
    }

    //we have to retrieve the personas too
    Promise.all([senderCP, receiverCP, senderAtomP, recipientAtomP]).then(
      ([
        senderConnectionRelevant,
        receiverConnectionRelevant,
        senderAtom,
        recipientAtom,
      ]) => {
        if (receiverConnectionRelevant) {
          console.debug("Change ReceiverConnectionState ", recipientAtom);
          dispatch({
            type: actionTypes.messages.connectMessageReceived,
            payload: {
              updatedConnectionUri: receiverConnectionUri,
              ownedAtomUri: recipientAtomUri,
              message: event,
            },
          });
        }

        if (senderConnectionRelevant) {
          console.debug("Change SenderConnectionState ", senderAtom);
          dispatch({
            type: actionTypes.messages.connectMessageSent,
            payload: {
              senderConnectionUri: senderConnectionUri,
              senderAtomUri: senderAtomUri,
              event: event,
            },
          });
        }
      }
    );
  };
}

export function markAsRetracted(event) {
  return dispatch => {
    const payload = {
      messageUri: event.messageUri,
      connectionUri: event.connectionUri,
      atomUri: event.atomUri,
      retracted: event.retracted,
    };

    dispatch({
      type: actionTypes.messages.messageStatus.markAsRetracted,
      payload: payload,
    });
  };
}

export function updateMessageStatus(event) {
  return dispatch => {
    const payload = {
      messageUri: event.messageUri,
      connectionUri: event.connectionUri,
      atomUri: event.atomUri,
      messageStatus: event.messageStatus,
    };

    dispatch({
      type: actionTypes.messages.updateMessageStatus,
      payload: payload,
    });
  };
}

export function markAsRejected(event) {
  return dispatch => {
    const payload = {
      messageUri: event.messageUri,
      connectionUri: event.connectionUri,
      atomUri: event.atomUri,
      rejected: event.rejected,
    };

    dispatch({
      type: actionTypes.messages.messageStatus.markAsRejected,
      payload: payload,
    });
  };
}

export function markAsProposed(event) {
  return dispatch => {
    const payload = {
      messageUri: event.messageUri,
      connectionUri: event.connectionUri,
      atomUri: event.atomUri,
      proposed: event.proposed,
    };

    dispatch({
      type: actionTypes.messages.messageStatus.markAsProposed,
      payload: payload,
    });
  };
}

export function markAsClaimed(event) {
  return dispatch => {
    const payload = {
      messageUri: event.messageUri,
      connectionUri: event.connectionUri,
      atomUri: event.atomUri,
      claimed: event.claimed,
    };

    dispatch({
      type: actionTypes.messages.messageStatus.markAsClaimed,
      payload: payload,
    });
  };
}

export function markAsAccepted(event) {
  return dispatch => {
    const payload = {
      messageUri: event.messageUri,
      connectionUri: event.connectionUri,
      atomUri: event.atomUri,
      accepted: event.accepted,
    };

    dispatch({
      type: actionTypes.messages.messageStatus.markAsAccepted,
      payload: payload,
    });
  };
}

export function markAsCancelled(event) {
  return dispatch => {
    const payload = {
      messageUri: event.messageUri,
      connectionUri: event.connectionUri,
      atomUri: event.atomUri,
      cancelled: event.cancelled,
    };

    dispatch({
      type: actionTypes.messages.messageStatus.markAsCancelled,
      payload: payload,
    });
  };
}

export function markAsCancellationPending(event) {
  return dispatch => {
    const payload = {
      messageUri: event.messageUri,
      connectionUri: event.connectionUri,
      atomUri: event.atomUri,
      cancellationPending: event.cancellationPending,
    };

    dispatch({
      type: actionTypes.messages.messageStatus.markAsCancellationPending,
      payload: payload,
    });
  };
}

export function atomMessageReceived(event) {
  return (dispatch, getState) => {
    //first check if we really have the 'own' atom in the state - otherwise we'll ignore the hint
    const atom = getState().getIn(["atoms", event.getRecipientAtom()]);
    if (!atom) {
      console.debug(
        "ignoring atomMessage for an atom that is not ours:",
        event.getRecipientAtom()
      );
    }
    dispatch({
      type: actionTypes.messages.atomMessageReceived,
      payload: {
        atomUri: event.getRecipientAtom(),
        humanReadable: atom.get("humanReadable"),
        message: event.getTextMessage(),
      },
    });
  };
}

export function processSocketHintMessage(event) {
  return (dispatch, getState) => {
    const recipientAtomUri = event.getRecipientAtom();
    //const targetSocketUri = event.getHintTargetSocket(); //we currently dont need to know the targetSocketUri of the message (is known by fetching the connection)

    const currentState = getState();
    const recipientConnUri = event.getRecipientConnection();
    const recipientAtom = getIn(currentState, ["atoms", recipientAtomUri]);

    if (!recipientAtom) {
      console.debug(
        "ignoring hint for an atom that is not yet in the state (could be a targetAtom, or a non stored ownedAtom):",
        recipientAtomUri
      );
    } else if (!recipientConnUri) {
      console.debug("ignoring hint without a receiver(Connection)Uri:", event);
    } else {
      stateStore.fetchActiveConnectionAndDispatch(
        recipientConnUri,
        recipientAtomUri,
        dispatch
      );
    }
  };
}

export function processAtomHintMessage(event) {
  //TODO: Needs refactoring as atomHints are completely different and without a connection since the split into two different hintTypes
  return (dispatch, getState) => {
    //first check if we really have the 'own' atom in the state - otherwise we'll ignore the hint
    const ownedAtomUri = event.getRecipientAtom();
    const targetAtomUri = event.getHintTargetAtom();

    const currentState = getState();
    const ownedAtom = getIn(currentState, ["atoms", ownedAtomUri]);
    const targetAtom = getIn(currentState, ["atoms", targetAtomUri]);

    const ownedConnectionUri = event.getRecipientConnection();

    if (!ownedAtom) {
      console.debug(
        "ignoring hint for an atom that is not yet in the state (could be a targetAtom, or a non stored ownedAtom):",
        ownedAtomUri
      );
    } else if (atomUtils.isInactive(targetAtom)) {
      console.debug("ignoring hint for an inactive atom:", targetAtomUri);
    } else {
      Promise.resolve()
        .then(() => {
          if (targetAtom) {
            return Promise.resolve(true);
          } else {
            return stateStore.fetchAtomAndDispatch(
              targetAtomUri,
              dispatch,
              getState
            );
          }
        })
        .then(() =>
          stateStore.fetchActiveConnectionAndDispatch(
            ownedConnectionUri,
            ownedAtomUri,
            dispatch
          )
        );
    }
  };
}

/**
 * Dispatches actions registered for the "failureOwn" event for the specified message uri.
 * The corresponding reducer clears any registered actions for the "successOwn" event
 */
export function dispatchActionOnFailureOwn(event) {
  return (dispatch, getState) => {
    const toDispatchList = getState().getIn([
      "messages",
      "dispatchOnFailureOwn",
      event.getIsResponseTo(),
    ]);
    if (toDispatchList) {
      toDispatchList.forEach(d => {
        dispatch(d);
      });
    }
    //the reducer will delete the toDispatchList for successOwn and failureOwn
    dispatch({
      type: actionTypes.messages.dispatchActionOn.failureOwn,
      payload: {
        eventUri: event.getIsResponseTo(),
      },
    });
  };
}

/**
 * Dispatches actions registered for the "successRemote" event for the specified message uri.
 * The corresponding reducer clears any registered actions for the "failureRemote" event
 */
export function dispatchActionOnSuccessRemote(event) {
  return (dispatch, getState) => {
    const messageUri = event.getIsRemoteResponseTo();
    const connectionUri = event.getRecipientConnection();

    const toDispatchList = getState().getIn([
      "messages",
      "dispatchOnSuccessRemote",
      messageUri,
    ]);

    const toAutoClaim = getState().getIn([
      "messages",
      "claimOnSuccess",
      messageUri,
    ]);

    const toRefreshData = getState().getIn([
      "messages",
      "refreshDataOnSuccess",
      messageUri,
    ]);

    if (toRefreshData) {
      dispatch({
        type: actionTypes.connections.setLoadingPetriNetData,
        payload: {
          connectionUri: connectionUri,
          loadingPetriNetData: true,
        },
      });

      ownerApi
        .getPetriNetUris(connectionUri)
        .then(response => {
          const petriNetData = {};

          response.forEach(entry => {
            if (entry.processURI) {
              petriNetData[entry.processURI] = entry;
            }
          });

          const petriNetDataImm = Immutable.fromJS(petriNetData);

          dispatch({
            type: actionTypes.connections.updatePetriNetData,
            payload: {
              connectionUri: connectionUri,
              petriNetData: petriNetDataImm,
            },
          });
        })
        .catch(error => {
          console.error("Error:", error);
          dispatch({
            type: actionTypes.connections.setLoadingPetriNetData,
            payload: {
              connectionUri: connectionUri,
              loadingPetriNetData: false,
            },
          });
        });
    }

    if (toAutoClaim) {
      //TODO: FIX WHAT THIS AUTOCLAIM DOES
      const socketUri = undefined; //TODO: FIND CORRECT SOCKETURIS
      const targetSocketUri = undefined; //TODO: FIND CORRECT SOCKETURIS

      const ownedAtomUri = event.getRecipientAtom();

      let referencedContentUris = new Map().set("claims", [
        { "@id": event.getIsRemoteResponseTo() },
      ]);

      /*
      This Dispatch is similar to the one we use in connection-actions.js ->
        function connectionsChatMessage(...)
        The part where we iterate over all the references and send the dispatches to mark the
        message appropriately. usually we need to check whether the messageUri to be marked is
        the remoteMessageUri or the ownMessageUri, but since the autoClaim will only be executed
        on ownMessages we do not need this check here
       */
      /*TODO:
       Since we set a messageToBe (successfully) claimed before we even know if the transition was successful
       we might need to rethink this implementation in favor of a dirtyState somehow, and remove the dirty state on success
       of the message(if(toRefreshData)-part above)... but for now and because
       connectionsChateMessage does not do this either it will do...*/
      dispatch({
        type: actionTypes.messages.messageStatus.markAsClaimed,
        payload: {
          messageUri: event.getIsRemoteResponseTo(),
          connectionUri: connectionUri,
          atomUri: ownedAtomUri,
          claimed: true,
        },
      });

      buildChatMessage({
        chatMessage: undefined,
        additionalContent: undefined,
        referencedContentUris: referencedContentUris,
        socketUri: socketUri,
        targetSocketUri: targetSocketUri,
        isTTL: false,
      })
        .then(msgData =>
          Promise.all([
            won.wonMessageFromJsonLd(msgData.message),
            ownerApi.sendMessage(msgData.message),
          ])
        )
        .then(([optimisticEvent, jsonResp]) => {
          dispatch({
            type: actionTypes.connections.sendChatMessageRefreshDataOnSuccess,
            payload: {
              eventUri: jsonResp.messageUri,
              message: jsonResp.message,
              optimisticEvent,
            },
          });
        })
        .catch(e => {
          console.error("Error while processing chat message: ", e);
          dispatch({
            type: actionTypes.connections.sendChatMessageFailed,
            payload: {
              error: e,
              message: e.message,
            },
          });
        });
    }

    if (toDispatchList) {
      toDispatchList.forEach(d => {
        if (d.type) {
          dispatch(d);
        } else {
          // if an adHocConnection was successfully created, go to the correct connectionUri
          if (d.connectionUri === "responseEvent::receiverUri") {
            dispatch(
              actionCreators.router__stateGoCurrent({
                connectionUri,
              })
            );
          }
        }
      });
    }
    //the reducer will delete the toDispatchList for successOwn and failureOwn
    dispatch({
      type: actionTypes.messages.dispatchActionOn.successRemote,
      payload: {
        eventUri: messageUri,
      },
    });
  };
}

/**
 * Dispatches actions registered for the "failureRemote" event for the specified message uri.
 * The corresponding reducer clears any registered actions for the "successRemote" event
 */
export function dispatchActionOnFailureRemote(event) {
  return (dispatch, getState) => {
    const toDispatchList = getState().getIn([
      "messages",
      "dispatchOnFailureRemote",
      event.getIsRemoteResponseTo(),
    ]);
    if (toDispatchList) {
      toDispatchList.forEach(d => {
        dispatch(d);
      });
    }
    //the reducer will delete the toDispatchList for successOwn and failureOwn
    dispatch({
      type: actionTypes.messages.dispatchActionOn.failureRemote,
      payload: {
        eventUri: event.getIsRemoteResponseTo(),
      },
    });
  };
}
