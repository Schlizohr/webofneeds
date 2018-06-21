import { parseNeed } from "./parse-need.js";
import Immutable from "immutable";
import won from "../../won-es6.js";

export function addNeed(needs, jsonldNeed, ownNeed) {
  const jsonldNeedImm = Immutable.fromJS(jsonldNeed);

  let newState;
  let parsedNeed = parseNeed(jsonldNeed, ownNeed);

  if (parsedNeed && parsedNeed.get("uri")) {
    let existingNeed = needs.get(parsedNeed.get("uri"));
    const isExistingOwnNeed = existingNeed && existingNeed.get("ownNeed");

    if ((ownNeed || isExistingOwnNeed) && existingNeed) {
      // If need is already present and the
      // need is claimed as an own need we set
      // have to set it
      const isBeingCreated = existingNeed.get("isBeingCreated");
      const isLoading = existingNeed.get("isLoading");
      const toLoad = existingNeed.get("toLoad");

      if (isBeingCreated || isLoading || toLoad) {
        // replace it
        parsedNeed = parsedNeed
          .set("connections", existingNeed.get("connections"))
          .set("ownNeed", true);
        console.log(
          "updateOwnNeed after load or creation: ",
          parsedNeed.get("uri")
        );
        return needs.setIn([parsedNeed.get("uri")], parsedNeed);
      } else {
        // just be sure we mark it as own need
        console.log("updateOwnNeed just in case: ", parsedNeed.get("uri"));
        return needs.setIn([parsedNeed.get("uri"), "ownNeed"], true);
      }
    } else if (!ownNeed && existingNeed) {
      // If need is already present and the
      // need is claimed as a non own need
      const isLoading = existingNeed.get("isLoading");
      const toLoad = existingNeed.get("toLoad");

      if (isLoading || toLoad) {
        // replace it
        parsedNeed = parsedNeed
          .set("connections", existingNeed.get("connections"))
          .set("ownNeed", false);
        console.log("updateTheirNeed after load: ", parsedNeed.get("uri"));
        return needs.setIn([parsedNeed.get("uri")], parsedNeed);
      } else {
        // just be sure we mark it as non own need
        console.log("updateTheirNeed just in case: ", parsedNeed.get("uri"));
        return needs.setIn([parsedNeed.get("uri"), "ownNeed"], false);
      }
    } else {
      console.log("addNeed if new: ", parsedNeed.get("uri"));
      return setIfNew(needs, parsedNeed.get("uri"), parsedNeed);
    }
  } else {
    console.error("Tried to add invalid need-object: ", jsonldNeedImm.toJS());
    newState = needs;
  }

  return newState;
}

export function addNeedInLoading(needs, needUri, state, ownNeed) {
  console.log("addNeedInLoading: ", needUri);
  const oldNeed = needs.get(needUri);
  if (oldNeed && !oldNeed.get("isLoading")) {
    return needs;
  } else {
    let need = Immutable.fromJS({
      uri: needUri,
      toLoad: false,
      isLoading: true,
      ownNeed: ownNeed,
      state: state,
      connections: Immutable.Map(),
    });
    return needs.setIn([needUri], need);
  }
}

export function addTheirNeedInLoading(needs, needUri) {
  console.log("addTheirNeedInLoading: ", needUri);
  const oldNeed = needs.get(needUri);
  if (oldNeed && (oldNeed.get("ownNeed") || !oldNeed.get("isLoading"))) {
    return needs;
  } else {
    let need = Immutable.fromJS({
      uri: needUri,
      toLoad: false,
      isLoading: true,
      ownNeed: false,
      connections: Immutable.Map(),
    });
    return needs.setIn([needUri], need);
  }
}

export function addOwnActiveNeedsInLoading(needs, needUris) {
  needUris &&
    needUris.size > 0 &&
    console.log("addOwnActiveNeedsInLoading: ", needUris);
  let newState = needs;
  needUris &&
    needUris.forEach(needUri => {
      newState = addNeedInLoading(
        newState,
        needUri,
        won.WON.ActiveCompacted,
        true
      );
    });
  return newState;
}

export function addOwnInactiveNeedsInLoading(needs, needUris) {
  needUris &&
    needUris.size > 0 &&
    console.log("addOwnInactiveNeedsInLoading: ", needUris);
  let newState = needs;
  needUris &&
    needUris.forEach(needUri => {
      newState = addNeedInLoading(
        newState,
        needUri,
        won.WON.InactiveCompacted,
        true
      );
    });
  return newState;
}

export function addTheirNeedsInLoading(needs, needUris) {
  needUris &&
    needUris.size > 0 &&
    console.log("addOwnInactiveNeedsInLoading: ", needUris);
  let newState = needs;
  needUris &&
    needUris.forEach(needUri => {
      newState = addTheirNeedInLoading(newState, needUri);
    });
  return newState;
}

export function addOwnInactiveNeedsToLoad(needs, needUris) {
  needUris &&
    needUris.size > 0 &&
    console.log("addOwnInactiveNeedsToLoad: ", needUris);
  let newState = needs;
  needUris &&
    needUris.forEach(needUri => {
      newState = addNeedToLoad(
        newState,
        needUri,
        won.WON.InactiveCompacted,
        true
      );
    });
  return newState;
}

export function addNeedToLoad(needs, needUri, state, ownNeed) {
  console.log("addNeedToLoad: ", needUri);
  if (needs.get(needUri)) {
    return needs;
  } else {
    let need = Immutable.fromJS({
      uri: needUri,
      toLoad: true,
      isLoading: false,
      ownNeed: ownNeed,
      state: state,
      connections: Immutable.Map(),
    });
    return needs.setIn([needUri], need);
  }
}

export function addNeedInCreation(needs, needInCreation, needUri) {
  let newState;
  let need = Immutable.fromJS(needInCreation);

  if (need) {
    need = need.set("uri", needUri);
    need = need.set("ownNeed", true);
    need = need.set("isBeingCreated", true);
    need = need.set("connections", Immutable.Map());

    let type = undefined;
    let title = undefined;

    if (need.get("is")) {
      type = need.get("seeks")
        ? won.WON.BasicNeedTypeCombinedCompacted
        : won.WON.BasicNeedTypeSupplyCompacted;
      title = need.getIn(["is", "title"]);
      console.log("is title: ", title);
    }

    if (need.get("seeks")) {
      type = need.get("is")
        ? won.WON.BasicNeedTypeCombinedCompacted
        : won.WON.BasicNeedTypeDemandCompacted;
      title = need.getIn(["seeks", "title"]);
      console.log("seeks title: ", title);
    }

    need = need.set("type", type);
    need = need.set("title", title);

    let isWhatsAround = false;
    let isWhatsNew = false;

    if (
      need.getIn(["is", "whatsAround"]) ||
      need.getIn(["seeks", "whatsAround"])
    ) {
      isWhatsAround = true;
    }
    if (need.getIn(["is", "whatsNew"]) || need.getIn(["seeks", "whatsNew"])) {
      isWhatsNew = true;
    }

    need = need.set("isWhatsAround", isWhatsAround);
    need = need.set("isWhatsNew", isWhatsNew);

    newState = needs.setIn([needUri], need);
    console.log("need-reducer create new need: ", need.toJS());
  } else {
    console.error("Tried to add invalid need-object: ", needInCreation);
    newState = needs;
  }
  return newState;
}

function setIfNew(state, path, obj) {
  return state.update(
    path,
    val =>
      val
        ? // we've seen this need before, no need to overwrite it
          val
        : // it's the first time we see this need -> add it
          Immutable.fromJS(obj)
  );
}

export function markNeedAsRead(state, needUri) {
  const need = state.get(needUri);

  if (!need) {
    console.error("no need with needUri: <", needUri, ">");
    return state;
  }
  return state.setIn([needUri, "unread"], false);
}

export function changeNeedState(state, needUri, newState) {
  return state.setIn([needUri, "state"], newState);
}
