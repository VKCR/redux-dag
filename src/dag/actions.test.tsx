import { createAddNodeAction, createDeleteNodeAction, createUpdateNodeAction } from './actions';
import {
    ADD_NODE_ACTION,
    DELETE_NODE_ACTION,
    UPDATE_NODE_ACTION,
    DagAddNodeAction,
    DagDeleteNodeAction,
    DagUpdateNodeAction,
} from './types';

it('creates an AddNodeAction', () => {
    const id = 'id';
    const deps = ['a', 'b', 'c'];
    const updateFunction = () => 'val';

    const expectedAction = {
        type: ADD_NODE_ACTION,
        id,
        deps,
        updateFunction
    };

    const action: DagAddNodeAction = createAddNodeAction(id, deps, updateFunction);

    expect(action).toEqual(expectedAction);
});

it('creates a DeleteNodeAction', () => {
    const id = 'id';

    const expectedAction = {
        type: DELETE_NODE_ACTION,
        id
    };

    const action: DagDeleteNodeAction = createDeleteNodeAction(id);

    expect(action).toEqual(expectedAction);
});

it('creates an UpdateNodeAction', () => {
    const id = 'id';
    const updateFunction = () => 'val';

    const expectedAction = {
        type: UPDATE_NODE_ACTION,
        id,
        updateFunction
    };

    const action: DagUpdateNodeAction = createUpdateNodeAction(id, updateFunction);

    expect(action).toEqual(expectedAction);
});
