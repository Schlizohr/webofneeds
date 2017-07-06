/**
 * Created by syim on 11.12.2015.
 */
import { actionTypes } from '../actions/actions';
import Immutable from 'immutable';
import { createReducer } from 'redux-immutablejs'
import won from '../won-es6';

const initialState = Immutable.fromJS({
    ownNeeds: {},
    theirNeeds: {},
    allNeeds: {},
});

export default function(needs = initialState, action = {}) {
    switch(action.type) {
        case actionTypes.logout:
        case actionTypes.needs.clean:
            return initialState;

        case actionTypes.initialPageLoad:
        case actionTypes.login:
            let ownNeeds = action.payload.get('ownNeeds');
            ownNeeds = ownNeeds? ownNeeds : Immutable.Set();
            let theirNeeds = action.payload.get('theirNeeds');
            theirNeeds = theirNeeds? theirNeeds : Immutable.Set();
            const stateWithOwnNeeds = ownNeeds.reduce(
                (updatedState, ownNeed) => addNeed(updatedState, ownNeed, true),
                needs
            );
            const stateWithOwnAndTheirNeeds = theirNeeds.reduce(
                (updatedState, theirNeed) => addNeed(updatedState, theirNeed, false),
                stateWithOwnNeeds

            );
            return stateWithOwnAndTheirNeeds;

        case actionTypes.router.accessedNonLoadedPost:
            const theirNeed = action.payload.get('theirNeed');
            return addNeed(needs, theirNeed, false);

        case actionTypes.needs.fetch:
            //TODO needs supplied by this action don't have a list of already associated connections
            return action.payload.reduce(
                (updatedState, ownNeed) => addNeed(updatedState, ownNeed, true),
                needs
            );

        case actionTypes.needs.reopen:
            return needs.setIn([
                "ownNeeds", action.payload.ownNeedUri, 'won:isInState'
            ], won.WON.ActiveCompacted);

        case actionTypes.needs.close:
            return needs.setIn([
                "ownNeeds", action.payload.ownNeedUri, 'won:isInState'
            ], won.WON.InactiveCompacted);

        case actionTypes.needs.createSuccessful:
            return addNeed(needs, action.payload.need, true);

        case actionTypes.connections.load:
            var updatedNeeds =  action.payload.reduce(
                (updatedState, connectionWithRelatedData) =>
                    storeConnectionAndRelatedData(updatedState, connectionWithRelatedData),
                needs);
            return updatedNeeds;

        case actionTypes.messages.connectMessageReceived:
            const {ownNeedUri, remoteNeed, updatedConnection } = action.payload;
            const stateWithBothNeeds = addNeed(needs, remoteNeed, false); // guarantee that remoteNeed is in state
            return addConnection(stateWithBothNeeds, ownNeedUri, updatedConnection);

        case actionTypes.messages.hintMessageReceived:
            return storeConnectionAndRelatedData(needs, action.payload);

        default:
            return needs;
    }
}

function storeConnectionAndRelatedData(state, connectionWithRelatedData) {
    const {ownNeed, remoteNeed, connection} = connectionWithRelatedData;
    const stateWithOwnNeed = addNeed(state, ownNeed, true); // guarantee that ownNeed is in state
    const stateWithBothNeeds = addNeed(stateWithOwnNeed, remoteNeed, false); // guarantee that remoteNeed is in state
    return addConnection(stateWithBothNeeds, ownNeed['@id'], connection.uri);
}

function addNeed(needs, jsonldNeed, ownNeed) {
    const jsonldNeedImm = Immutable.fromJS(jsonldNeed);
    const mapName = ownNeed? "ownNeeds" : "theirNeeds";

    let newState;
    let parsedNeed = parseNeed(jsonldNeed, ownNeed);

    if(parsedNeed && parsedNeed.get("id")) {
        newState = setIfNew(needs, [mapName, parsedNeed.get("id")], jsonldNeedImm);
        newState = setIfNew(newState, ["allNeeds", parsedNeed.get("id")], parsedNeed);
    } else {
        console.error('Tried to add invalid need-object: ', jsonldNeedImm);
        newState = needs;
    }

    return newState;
}



function parseNeed(jsonldNeed, ownNeed) {
    const jsonldNeedImm = Immutable.fromJS(jsonldNeed);
    console.log("jsonldNeed: ", jsonldNeedImm);

    let parsedNeed = {id: undefined,
                title: undefined,
                description: undefined,
                type: undefined,
                state: undefined,
                tags: undefined,
                location: undefined,
                connections: undefined,
                creationDate: undefined,
                ownNeed};

    if(jsonldNeedImm){
        const id = jsonldNeedImm.get("@id");

        const is = jsonldNeedImm.get("won:is");
        const seeks = jsonldNeedImm.get("won:seeks");

        const title = is ? is.get("dc:title") : (seeks ? seeks.get("dc:title") : undefined);

        if(!!id && !!title){
            parsedNeed.id = id;
            parsedNeed.title = title;
        }else{
            return undefined;
        }

        const creationDate = jsonldNeedImm.getIn(["dct:created"]);
        if(creationDate){
            parsedNeed.creationDate = creationDate;
        }

        const state = jsonldNeedImm.getIn([won.WON.isInStateCompacted, "@id"]);
        if(state === won.WON.Active){ //we use to check for active state and everything else will be inactive
            parsedNeed.state = state;
        } else {
            parsedNeed.state = won.WON.Inactive;
        }

        let type = undefined;
        let description = undefined;
        let tags = undefined;

        if(is){
            type = seeks ? won.WON.BasicNeedTypeDotogetherCompacted : won.WON.BasicNeedTypeSupplyCompacted;
            description = is.get("dc:description");
            tags = is.get("won:hasTag");
        }else if(seeks){
            type = won.WON.BasicNeedTypeDemandCompacted;
            description = seeks.get("dc:description");
            tags = seeks.get("won:hasTag");
        }

        parsedNeed.tags = tags ? tags : undefined;
        parsedNeed.description = description ? description : undefined;
        parsedNeed.type = type;

        //TODO: LOCATION IS STILL MISSING
    }else{
        console.error('Cant parse need data is an invalid need-object: ', jsonldNeedImm);
        return undefined;
    }

    return Immutable.fromJS(parsedNeed);
}

/**
 * Add's the connectionUri to the needs connections. Makes
 * sure the same uri doesn't get added twice.
 * NOTE: As this function goes through all previous connections
 * to make sure that there are no duplicates, avoid using it
 * when adding a bunch of connections at once.
 * @param state
 * @param needUri
 * @param connectionUri
 * @return {*}
 */
function addConnection(state, needUri, connectionUri) {
    const pathToConnections = ['ownNeeds', needUri, 'won:hasConnections', 'rdfs:member'];
    if(!state.getIn(pathToConnections)) {
        //make sure the rdfs:member array exists
        state = state.setIn(pathToConnections, Immutable.List());
    }
    const connections = state.getIn(pathToConnections);
    if( connections.filter(c => c && c.get('@id') === connectionUri).size > 0) {
        // connection's already been added to the need before
        return state;
    } else {
        // new connection, add it to the need
        return state.updateIn(
            pathToConnections,
            connections => connections.push(
                Immutable.fromJS({ '@id': connectionUri })
            )
        );

    }
}

function setIfNew(state, path, obj){
    console.log("Set If New: ", state, "path", path, obj);
    return state.updateIn(path, val => val ?
        //we've seen this need before, no need to overwrite it
        val :
        //it's the first time we see this need -> add it
        Immutable.fromJS(obj))
}

