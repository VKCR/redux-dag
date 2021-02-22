import { createStore } from 'redux';
import { DagState, DagIdToNodeMap, DagIdToValueMap } from './types';
import { dagReducer, applyFnToDepGraph, callUpdateFn, cloneDagNode, cloneDagIdToNodeMap, cloneDagIdToValueMap } from './reducers';
import { createAddNodeAction, createDeleteNodeAction, createUpdateNodeAction } from './actions';
import { NodeAlreadyExistsError, NodeDoesNotExistError, DependencyDoesNotExistError, NodeHasDescendantsError } from './errors';

const initState: DagState = {
    nodeIds: ['a', 'b', 'c'],
    nodeByIds: {
        'a': {
            id: 'a',
            desc: ['c'],
            deps: [],
            updateFunction: () => 1
        },
        'b': {
            id: 'b',
            desc: ['c'],
            deps: [],
            updateFunction: () => 2
        },
        'c': {
            id: 'c',
            desc: [],
            deps: ['a', 'b'],
            updateFunction: defaultUpdateFn
        }
    },
    valueByIds: {
        'a': 1,
        'b': 2,
        'c': 3
    }
};

// Sums all dependency values
function defaultUpdateFn(values: DagIdToValueMap) {
    let sum = 0;
    for (const id in values) {
        if (values.hasOwnProperty(id)) {
            sum += Number(values[id]);
        }
    }
    return sum;
}

it('adds a free node to the graph', () => {
    const store = createStore(dagReducer, initState);
    const newNode = {
        id: 'd',
        desc: [],
        deps: [],
        updateFunction: () => 5
    };
    store.dispatch(createAddNodeAction(newNode.id, newNode.deps, newNode.updateFunction));
    expect(store.getState().nodeIds).toContain(newNode.id);
    expect(store.getState().nodeByIds[newNode.id]).toEqual(newNode);
    expect(store.getState().valueByIds[newNode.id]).toEqual(5);
});

it('adds a dependent node to the graph', () => {
    const store = createStore(dagReducer, initState);
    const newNode = {
        id: 'd',
        desc: [],
        deps: ['b', 'c'],
        updateFunction: defaultUpdateFn
    };
    store.dispatch(createAddNodeAction(newNode.id, newNode.deps, newNode.updateFunction));
    expect(store.getState().nodeIds).toContain(newNode.id);
    expect(store.getState().nodeByIds[newNode.id]).toEqual(newNode);
    expect(store.getState().valueByIds[newNode.id]).toEqual(5);
});

it('throws when you try to add a node that already exists', () => {
    const store = createStore(dagReducer, initState);
    const newNode = {
        id: 'a',
        desc: [],
        deps: [],
        updateFunction: defaultUpdateFn
    };
    expect(() => store.dispatch(createAddNodeAction(newNode.id, newNode.deps, newNode.updateFunction)))
        .toThrowError(NodeAlreadyExistsError(newNode.id));
});

it('throws when you try to add a node with dependencies which don\'t exist', () => {
    const store = createStore(dagReducer, initState);
    const newNode = {
        id: 'd',
        desc: [],
        deps: ['b', 'e'],
        updateFunction: defaultUpdateFn
    };
    expect(() => store.dispatch(createAddNodeAction(newNode.id, newNode.deps, newNode.updateFunction)))
        .toThrowError(DependencyDoesNotExistError('e'));
});

it('throws undefined when you try access a node in the updateFunction you don\'t depend on', () => {
    const store = createStore(dagReducer, initState);
    const newNode = {
        id: 'd',
        value: 1,
        desc: [],
        deps: ['a'],
        updateFunction: (values: DagIdToValueMap) => values['b'].value
    };
    expect(() => store.dispatch(createAddNodeAction(newNode.id, newNode.deps, newNode.updateFunction)))
        .toThrow('undefined');
});

it('verifies that the desc lists are correctly updated for multiple additions', () => {
    const store = createStore(dagReducer, initState);
    const nodeD = {
        id: 'd',
        desc: [],
        deps: ['a', 'c'],
        updateFunction: defaultUpdateFn
    };
    store.dispatch(createAddNodeAction(nodeD.id, nodeD.deps, nodeD.updateFunction));

    const nodeE = {
        id: 'e',
        desc: [],
        deps: ['b', 'd'],
        updateFunction: defaultUpdateFn
    };
    store.dispatch(createAddNodeAction(nodeE.id, nodeE.deps, nodeE.updateFunction));

    const nodeF = {
        id: 'f',
        desc: [],
        deps: ['d', 'e', 'c'],
        updateFunction: defaultUpdateFn
    };
    store.dispatch(createAddNodeAction(nodeF.id, nodeF.deps, nodeF.updateFunction));

    // Verify that the lists are topologically sorted
    expect(store.getState().nodeByIds['a'].desc).toEqual(['c', 'd', 'e', 'f']);
    expect(store.getState().nodeByIds['b'].desc).toEqual(['c', 'd', 'e', 'f']);
    expect(store.getState().nodeByIds['c'].desc).toEqual(['d', 'e', 'f']);
    expect(store.getState().nodeByIds['d'].desc).toEqual(['e', 'f']);
    expect(store.getState().nodeByIds['e'].desc).toEqual(['f']);
});

it('verifies that adding a node does not mutate the previous state', () => {
    const store = createStore(dagReducer, initState);
    const initialNodes = store.getState().nodeByIds;
    const prevNodes = cloneDagIdToNodeMap(initialNodes);
    const initialValues = store.getState().valueByIds;
    const prevValues = cloneDagIdToValueMap(initialValues);

    const newNode = {
        id: 'd',
        desc: [],
        deps: ['a', 'b'],
        updateFunction: defaultUpdateFn
    };
    store.dispatch(createAddNodeAction(newNode.id, newNode.deps, newNode.updateFunction));
    expect(initialNodes).not.toEqual(store.getState().nodeByIds);
    expect(initialNodes).toEqual(prevNodes);
    expect(initialValues).not.toEqual(store.getState().valueByIds);
    expect(initialValues).toEqual(prevValues);
});

it('deletes a node from the graph', () => {
    const store = createStore(dagReducer, initState);
    const idToDelete = 'c';
    expect(store.getState().nodeByIds[idToDelete]).toBeDefined();
    expect(store.getState().valueByIds[idToDelete]).toBeDefined();
    expect(store.getState().nodeIds).toContain(idToDelete);
    store.dispatch(createDeleteNodeAction(idToDelete));
    expect(store.getState().nodeByIds[idToDelete]).toBeUndefined();
    expect(store.getState().valueByIds[idToDelete]).toBeUndefined();
    expect(store.getState().nodeIds).not.toContain(idToDelete);
});

it('verifies that the desc list of a deleted node\'s ancestors get updated', () => {
    const store = createStore(dagReducer, initState);

    const newNode = {
        id: 'd',
        desc: [],
        deps: ['b', 'c'],
        updateFunction: defaultUpdateFn
    };
    store.dispatch(createAddNodeAction(newNode.id, newNode.deps, newNode.updateFunction));

    const idToDelete = 'd';
    expect(store.getState().nodeByIds['a'].desc).toContain(idToDelete);
    expect(store.getState().nodeByIds['b'].desc).toContain(idToDelete);
    expect(store.getState().nodeByIds['c'].desc).toContain(idToDelete);
    store.dispatch(createDeleteNodeAction(idToDelete));
    expect(store.getState().nodeByIds['a'].desc).not.toContain(idToDelete);
    expect(store.getState().nodeByIds['b'].desc).not.toContain(idToDelete);
    expect(store.getState().nodeByIds['c'].desc).not.toContain(idToDelete);
})

it('throws when you try to delete a node which does not exist', () => {
    const store = createStore(dagReducer, initState);
    const idToDelete = 'd';
    expect(() => store.dispatch(createDeleteNodeAction(idToDelete))).toThrowError(NodeDoesNotExistError(idToDelete));
});

it('throws when you try to delete a node which has descendants', () => {
    const store = createStore(dagReducer, initState);
    const idToDelete = 'a';
    expect(() => store.dispatch(createDeleteNodeAction(idToDelete))).toThrowError(NodeHasDescendantsError(idToDelete));
});

it('verifies that deleting a node does not mutate the previous state', () => {
    const store = createStore(dagReducer, initState);

    const initialNodes = store.getState().nodeByIds;
    const prevNodes = cloneDagIdToNodeMap(initialNodes);
    const initialValues = store.getState().valueByIds;
    const prevValues = cloneDagIdToValueMap(initialValues);

    const idToDelete = 'c';
    store.dispatch(createDeleteNodeAction(idToDelete));

    expect(initialNodes).not.toEqual(store.getState().nodeByIds);
    expect(initialNodes).toEqual(prevNodes);
    expect(initialValues).not.toEqual(store.getState().valueByIds);
    expect(initialValues).toEqual(prevValues);
});

it('updates a node\'s value', () => {
    const store = createStore(dagReducer, initState);

    const idToUpdate = 'a';
    const newValue = 3;
    const newUpdateFunction = () => newValue;

    expect(store.getState().nodeByIds[idToUpdate].updateFunction).not.toEqual(newUpdateFunction);
    expect(store.getState().valueByIds[idToUpdate]).not.toEqual(newValue);

    store.dispatch(createUpdateNodeAction(idToUpdate, newUpdateFunction));

    expect(store.getState().nodeByIds[idToUpdate].updateFunction).toEqual(newUpdateFunction);
    expect(store.getState().valueByIds[idToUpdate]).toEqual(newValue);
});

it('throws when you try to update the value of a node which does not exist', () => {
    const store = createStore(dagReducer, initState);
    const idToUpdate = 'd';
    expect(() => store
        .dispatch(createUpdateNodeAction(idToUpdate, defaultUpdateFn)))
        .toThrowError(NodeDoesNotExistError(idToUpdate));
});

it('verifies that updating a node does not mutate the previous state', () => {
    const store = createStore(dagReducer, initState);

    const initialNodes = store.getState().nodeByIds;
    const initialValues = store.getState().valueByIds;
    const prevNodes = cloneDagIdToNodeMap(initialNodes);
    const prevValues = cloneDagIdToValueMap(initialValues);

    const idToUpdate = 'a';
    const newValue = 3;
    const newUpdateFunction = () => newValue;

    store.dispatch(createUpdateNodeAction(idToUpdate, newUpdateFunction));

    expect(initialNodes).not.toEqual(store.getState().nodeByIds);
    expect(initialNodes).toEqual(prevNodes);
    expect(initialValues).not.toEqual(store.getState().nodeByIds);
    expect(initialValues).toEqual(prevValues);
});

it('verifies that the desc node values are correctly updated after a root node update', () => {
    const store = createStore(dagReducer, initState);
    const nodeD = {
        id: 'd',
        desc: [],
        deps: ['a', 'c'],
        updateFunction: defaultUpdateFn
    };
    store.dispatch(createAddNodeAction(nodeD.id, nodeD.deps, nodeD.updateFunction));

    const nodeE = {
        id: 'e',
        desc: [],
        deps: ['b', 'd'],
        updateFunction: defaultUpdateFn
    };
    store.dispatch(createAddNodeAction(nodeE.id, nodeE.deps, nodeE.updateFunction));

    const nodeF = {
        id: 'f',
        desc: [],
        deps: ['d', 'e', 'c'],
        updateFunction: defaultUpdateFn
    };
    store.dispatch(createAddNodeAction(nodeF.id, nodeF.deps, nodeF.updateFunction));

    const idToUpdate = 'a';
    const newValue = 10;
    const newUpdateFunction = () => newValue;
    const oldValues = store.getState().valueByIds;
    store.dispatch(createUpdateNodeAction(idToUpdate, newUpdateFunction));

    const newValues = store.getState().valueByIds;
    expect(newValues['a']).toEqual(newValue);
    expect(newValues['b']).toEqual(oldValues['b']);
    expect(newValues['c']).toEqual(newValues['a'] + newValues['b']);
    expect(newValues['d']).toEqual(newValues['a'] + newValues['c']);
    expect(newValues['e']).toEqual(newValues['b'] + newValues['d']);
    expect(newValues['f']).toEqual(newValues['d'] + newValues['e'] + newValues['c']);
});

it('verifies that node values can be callbacks, and will be properly updated', () => {
    const store = createStore(dagReducer, initState);
    const nodeD = {
        id: 'd',
        desc: [],
        deps: ['a', 'b'],
        updateFunction: (vals: DagIdToValueMap) => {
            return () => 2 * (vals['a'] + vals['b']);
        }
    };
    store.dispatch(createAddNodeAction(nodeD.id, nodeD.deps, nodeD.updateFunction));

    const nodeE = {
        id: 'e',
        desc: [],
        deps: ['d'],
        updateFunction: (vals: DagIdToValueMap) => {
            return vals['d']() + 1;
        }
    };
    store.dispatch(createAddNodeAction(nodeE.id, nodeE.deps, nodeE.updateFunction));
    expect(store.getState().valueByIds['e']).toEqual(7);

    store.dispatch(createUpdateNodeAction('a', () => 10));
    expect(store.getState().valueByIds['e']).toEqual(25);
});

it('preserves the topological order despite adding and deleting nodes', () => {
    const store = createStore(dagReducer, initState);

    expect(store.getState().nodeIds).toEqual(['a', 'b', 'c']);

    store.dispatch(createAddNodeAction('d', [], () => 0));
    store.dispatch(createAddNodeAction('e', ['a', 'c'], defaultUpdateFn));

    expect(store.getState().nodeIds).toEqual(['a', 'b', 'c', 'd', 'e']);

    store.dispatch(createDeleteNodeAction('d'));

    expect(store.getState().nodeIds).toEqual(['a', 'b', 'c', 'e']);
});

it('verifies the correctness of callUpdateFn', () => {
    const nodeByIds = cloneDagIdToNodeMap(initState.nodeByIds);
    const valueByIds = cloneDagIdToValueMap(initState.valueByIds);

    valueByIds['a'] = 10;
    callUpdateFn('c', nodeByIds, valueByIds);

    expect(valueByIds['c']).toEqual(12);
});

it('verifies the correctness of applyFnToDepGraph', () => {
    const graph: DagIdToNodeMap = {
        'a': { id: 'a', desc: [], deps: [], updateFunction: () => 0 },
        'b': { id: 'b', desc: [], deps: ['a'], updateFunction: () => 0 },
        'c': { id: 'c', desc: [], deps: ['a', 'b'], updateFunction: () => 0 },
        'd': { id: 'd', desc: [], deps: ['b', 'c'], updateFunction: () => 0 },
        'e': { id: 'e', desc: [], deps: ['a', 'd'], updateFunction: () => 0 },
        'f': { id: 'f', desc: [], deps: ['b', 'c'], updateFunction: () => 0 },
        'g': { id: 'g', desc: [], deps: ['d', 'f'], updateFunction: () => 0 }
    };

    let collect: string[] = [];
    applyFnToDepGraph(graph, graph['g'], (node) => {
        collect.push(node.id);
    });
    expect(collect).toEqual(['d', 'f', 'b', 'c', 'a']);

    collect = [];
    applyFnToDepGraph(graph, graph['e'], (node) => {
        collect.push(node.id);
    });
    expect(collect).toEqual(['a', 'd', 'b', 'c']);
});

it('verifies the correctness of cloneDagNode', () => {
    const node = cloneDagNode(initState.nodeByIds['a']);
    node.updateFunction = () => 10;
    expect(initState.nodeByIds['a'].updateFunction).not.toEqual(node.updateFunction);
});

it('verifies the correctness of cloneDagIdToNodeMap', () => {
    const nodeByIds = cloneDagIdToNodeMap(initState.nodeByIds);
    nodeByIds['a'].updateFunction = () => 10;
    expect(initState.nodeByIds['a'].updateFunction).not.toEqual(nodeByIds['a'].updateFunction);
});

it('verifies the correctness of cloneDagIdToValueMap', () => {
    const valueByIds = cloneDagIdToValueMap(initState.valueByIds);
    valueByIds['a'] = 10;
    expect(initState.valueByIds['a']).not.toEqual(valueByIds['a']);
});
