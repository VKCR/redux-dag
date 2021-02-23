/*
   Dag definitions
*/

export type DagValueUpdateFunction = (deps: DagIdToValueMap) => any;

export interface DagNode {
    id: string;
    desc: string[]; // The list of descendants
    deps: string[]; // The list of dependencies
    updateFunction: DagValueUpdateFunction; // Value update function
}

export interface DagIdToNodeMap {
    [id: string]: DagNode;
}

export interface DagIdToValueMap {
    [id: string]: any;
}

export interface DagState {
    nodeIds: string[];
    nodeByIds: DagIdToNodeMap;
    valueByIds: DagIdToValueMap;
}

/*
   Dag Redux action definitions
*/

export const ADD_NODE_ACTION = 'ADD_NODE';
export const DELETE_NODE_ACTION = 'DELETE_NODE';
export const UPDATE_NODE_ACTION = 'UPDATE_NODE';

export interface DagAddNodeAction {
    type: typeof ADD_NODE_ACTION;
    id: string;
    deps: string[];
    updateFunction: DagValueUpdateFunction;
}

export interface DagDeleteNodeAction {
    type: typeof DELETE_NODE_ACTION;
    id: string;
}

export interface DagUpdateNodeAction {
    type: typeof UPDATE_NODE_ACTION;
    id: string;
    updateFunction: DagValueUpdateFunction;
}

export type DagAction = DagAddNodeAction | DagDeleteNodeAction | DagUpdateNodeAction;
