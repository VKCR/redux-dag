import React from 'react';
import { DagViewer, DagControlPanel } from './visualizer'
import './App.css';

function App() {
    return (
        <div className="App">
            <main>
                <DagControlPanel />
                <DagViewer />
            </main>
        </div>
    );
}

export default App;
