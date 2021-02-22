import React from 'react';
import { devToolsEnhancer } from 'redux-devtools-extension';
import { dagReducer } from './dag/reducers';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { DagViewer, DagControlPanel } from './dag/visualizer'

import './App.css';

const store = createStore(dagReducer, devToolsEnhancer({}));

function App() {
    return (
        <div className="App">
            <Provider store={store}>
                <main>
                    <DagViewer />
                    <DagControlPanel />
                </main>
            </Provider>
        </div>
    );
}



export default App;
