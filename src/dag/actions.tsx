import {
    ADD_NODE_ACTION,
    DELETE_NODE_ACTION,
    UPDATE_NODE_ACTION,
    DagAddNodeAction,
    DagDeleteNodeAction,
    DagUpdateNodeAction,
    DagValueUpdateFunction
} from './types';

export function createAddNodeAction(
    id: string,
    deps: string[],
    updateFunction: DagValueUpdateFunction): DagAddNodeAction {
    return {
        type: ADD_NODE_ACTION,
        id,
        deps,
        updateFunction
    };
}

export function createDeleteNodeAction(id: string): DagDeleteNodeAction {
    return {
        type: DELETE_NODE_ACTION,
        id
    };
}

export function createUpdateNodeAction(id: string, updateFunction: DagValueUpdateFunction): DagUpdateNodeAction {
    return {
        type: UPDATE_NODE_ACTION,
        id,
        updateFunction
    };
}
