import { createStore } from 'redux';
import { dagReducer } from './reducers';
import { DagViewer } from './visualizer';
import { DagState } from './types';

/*
   TODO:
   - check that the initial view is valid
   - check that adding a node is reflected in a ui change
   - check that deleting a node is reflected in a ui change
   - check that updating a node is reflected in a ui change
*/

let store;

beforeAll(() => {
    const initState: DagState = {
        nodeIds: [],
        nodeByIds: {},
        valueByIds: {}
    };
    store = createStore(dagReducer, initState);
});

it('renders the UI of the Dag viewer correctly', () => {
    // todo
});
