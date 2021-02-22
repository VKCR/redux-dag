import {
    DagNode,
    DagState,
    DagIdToNodeMap,
    DagIdToValueMap,
    DagAction,
    DagAddNodeAction,
    DagDeleteNodeAction,
    DagUpdateNodeAction,
    ADD_NODE_ACTION,
    DELETE_NODE_ACTION,
    UPDATE_NODE_ACTION
} from './types';

import {
    NodeAlreadyExistsError,
    DependencyDoesNotExistError,
    NodeDoesNotExistError,
    NodeHasDescendantsError,
} from './errors';

const initialState: DagState = {
    nodeIds: [],
    nodeByIds: {},
    valueByIds: {}
};

export function dagReducer(state = initialState, action: DagAction): DagState {
    switch (action.type) {
        case ADD_NODE_ACTION:
            return addNode(state, action);

        case DELETE_NODE_ACTION:
            return deleteNode(state, action);

        case UPDATE_NODE_ACTION:
            return updateNodeValue(state, action);

        default:
            return state;
    }
}

function addNode(state: DagState, action: DagAddNodeAction): DagState {
    const { id, deps, updateFunction } = action;

    // Check that a node with that ID does not already exist
    if (state.nodeIds.includes(id)) {
        throw NodeAlreadyExistsError(id);
    }

    // Check that all dependencies exist
    deps.forEach(depId => {
        if (!state.nodeIds.includes(depId)) {
            throw DependencyDoesNotExistError(depId);
        }
    });

    // Construct the new node to add
    const node: DagNode = {
        id,
        desc: [],
        deps: [...deps],
        updateFunction
    };

    // Clone state
    const nodeIds = [...state.nodeIds, id];
    const nodeByIds = cloneDagIdToNodeMap(state.nodeByIds);
    const valueByIds = cloneDagIdToValueMap(state.valueByIds);

    // Add new node to state, and calculate its value
    nodeByIds[node.id] = node;
    callUpdateFn(node.id, nodeByIds, valueByIds);

    // Update the desc list of all nodes in the dependency tree of the newly added node
    const descUpdateFn = (descNode: DagNode) => {
        descNode.desc.push(node.id);
    };
    applyFnToDepGraph(nodeByIds, node, descUpdateFn);

    return { nodeIds, nodeByIds, valueByIds };
}

function deleteNode(state: DagState, action: DagDeleteNodeAction): DagState {
    const { id } = action;

    // Check that node exists
    if (!state.nodeIds.includes(id)) {
        throw NodeDoesNotExistError(id);
    }

    // Check that node has no descendants which depend on it
    if (state.nodeByIds[id].desc.length > 0) {
        throw NodeHasDescendantsError(id);
    }

    // Clone state
    const nodeIds = state.nodeIds.filter(nodeId => nodeId !== id);
    const valueByIds = cloneDagIdToValueMap(state.valueByIds);
    const nodeByIds = cloneDagIdToNodeMap(state.nodeByIds);

    // Update the desc list of all nodes in the dependency tree of the deleted node
    const descUpdateFn = (descNode: DagNode) => {
        descNode.desc = descNode.desc.filter(descNodeId => descNodeId !== id);
    };
    applyFnToDepGraph(nodeByIds, nodeByIds[id], descUpdateFn);

    // Delete references to the deleted node
    delete nodeByIds[id];
    delete valueByIds[id];

    return { nodeIds, nodeByIds, valueByIds };
}

function updateNodeValue(state: DagState, action: DagUpdateNodeAction): DagState {
    const { id, updateFunction } = action;

    // Check that node exists
    if (!state.nodeIds.includes(id)) {
        throw NodeDoesNotExistError(id);
    }

    // Clone state
    const nodeIds = [...state.nodeIds];
    const nodeByIds = cloneDagIdToNodeMap(state.nodeByIds);
    const valueByIds = cloneDagIdToValueMap(state.valueByIds);

    // Update the node's value function, and calculate the new value
    nodeByIds[id].updateFunction = updateFunction;
    callUpdateFn(id, nodeByIds, valueByIds);

    // Update the values of all the node's descendants by calling their updateFunction
    for (const descId of nodeByIds[id].desc) {
        callUpdateFn(descId, nodeByIds, valueByIds);
    }

    return { nodeIds, nodeByIds, valueByIds };
}

// Warning: mutates the provided state
export function applyFnToDepGraph(
    nodeByIds: DagIdToNodeMap,
    source: DagNode,
    applyFn: (node: DagNode) => void): void {
    const toVisit = [source.id];
    const seen = [source.id];

    while (toVisit.length > 0) {
        const current = nodeByIds[(toVisit.shift() as string)]; // necessary typecheck
        for (const depId of current.deps) {
            if (!seen.includes(depId)) {
                applyFn(nodeByIds[depId]);
                toVisit.push(depId);
                seen.push(depId);
            }
        }
    }
}

// Warning: mutates the provided state
export function callUpdateFn(id: string, nodeByIds: DagIdToNodeMap, valueByIds: DagIdToValueMap): void {
    const node: DagNode = nodeByIds[id];
    const depValues: DagIdToValueMap = {};

    // Filter by dependencies
    for (const depId of node.deps) {
        depValues[depId] = valueByIds[depId];
    }

    // clone dependencies to ensure purity of update function
    valueByIds[id] = node.updateFunction(cloneDagIdToValueMap(depValues));
}

// Utility function to deep clone DagNodes and DagIdToNodeMaps
export function cloneDagNode(node: DagNode): DagNode {
    return {
        id: node.id,
        desc: [...node.desc],
        deps: [...node.deps],
        updateFunction: node.updateFunction
    };
}

export function cloneDagIdToNodeMap(nodeByIds: DagIdToNodeMap): DagIdToNodeMap {
    const newNodeByIds: DagIdToNodeMap = {};
    for (const id in nodeByIds) {
        if (nodeByIds.hasOwnProperty(id)) {
            newNodeByIds[id] = cloneDagNode(nodeByIds[id]);
        }
    }
    return newNodeByIds;
}

export function cloneDagIdToValueMap(valueByIds: DagIdToValueMap): DagIdToValueMap {
    const newValueByIds: DagIdToValueMap = {};
    for (const id in valueByIds) {
        if (valueByIds.hasOwnProperty(id)) {
            newValueByIds[id] = valueByIds[id]; // TODO: this won't deep copy if the value is an object!
        }
    }
    return newValueByIds;
}
