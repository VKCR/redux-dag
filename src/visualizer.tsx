import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DagState, DagIdToValueMap } from './dag/types';
import { createAddNodeAction, createDeleteNodeAction, createUpdateNodeAction } from './dag/actions';


/*
   Props types definitions
*/

export interface DagNodeViewProps {
    id: string;
}

export interface TextInputProps {
    id: string;
    label: string;
}

export interface ResultProps {
    status: 'OK' | 'ERROR';
    message: string;
}

/*
   Component definitions
*/

export function DagViewer() {
    const nodeIds = useSelector((state: DagState) => state.nodeIds);

    if (nodeIds.length) {
        return (
            <div className="dagViewer">
                <h2>Node list</h2>
                <ul>
                    {nodeIds.map(id => <li key={id}><DagNodeView id={id} /></li>)}
                </ul>
            </div>
        );
    }
    else {
        return (
            <div className="dagViewer">
                <h2>Node list</h2>
                <p>Empty graph</p>
            </div>
        );
    }
}

function DagNodeView({ id }: DagNodeViewProps) {
    const node = useSelector((state: DagState) => state.nodeByIds[id]);
    const value = useSelector((state: DagState) => state.valueByIds[id]);

    return (
        <div>
            <p>
                <span>Id: {node.id}</span>
	| <span>value: {value}</span>
	| <span>desc : ({node.desc.join(' ; ')})</span>
	| <span>deps : ({node.deps.join(' ; ')})</span>
            </p>
        </div>
    );
}

export function DagControlPanel() {
    return (
        <div className="dagControlPanel">
            <h3>In this demo, the update function of a node is to sum its value, if provided, with the values of all of its dependencies</h3>
            <AddNodeInput />
            <DeleteNodeInput />
            <UpdateNodeInput />
        </div>
    );
}

function AddNodeInput() {
    const initialResult: ResultProps = { status: 'OK', message: '' };
    const [lastResult, setLastResult] = useState(initialResult);

    const idRef = useRef<HTMLInputElement>(null);
    const valueRef = useRef<HTMLInputElement>(null);
    const depsRef = useRef<HTMLInputElement>(null);

    const dispatch = useDispatch();

    return (
        <div>
            <h3>Add node:</h3>
            <TextInput id="addNode-id" label="Node id:" ref={idRef} />
            <TextInput id="addNode-value" label="Node value:" ref={valueRef} />
            <TextInput id="addNode-dep" label="Dependencies (space separated):" ref={depsRef} />
            <input type="button" value="Add!" id="addNode-submit" onClick={() => {
                const id = idRef.current?.value;
                const value = valueRef.current?.value;
                const deps = depsRef.current?.value
                    ? depsRef.current?.value.trim().split(' ')
                    : []; // default to empty array
                const updateFunction = (valueByIds: DagIdToValueMap) => {
                    // For this simple example, we sum the given value with all the dependency values
                    let sum: number = value ? Number(value) : 0;
                    for (const depId in valueByIds) {
                        if (valueByIds.hasOwnProperty(depId)) {
                            sum += Number(valueByIds[depId]);
                        }
                    }
                    return sum;
                };

                if (id && value) {
                    try {
                        dispatch(createAddNodeAction(id, deps, updateFunction));
                        setLastResult({ status: 'OK', message: '' });
                    } catch (error) {
                        setLastResult({ status: 'ERROR', message: error.message });
                    }
                }
            }} />
            <Result message={lastResult.message} status={lastResult.status} />
        </div>
    );
}

function DeleteNodeInput() {
    const initialResult: ResultProps = { status: 'OK', message: '' };
    const [lastResult, setLastResult] = useState(initialResult);

    const idRef = useRef<HTMLInputElement>(null);

    const dispatch = useDispatch();

    return (
        <div>
            <h3>Delete node:</h3>
            <TextInput id="deleteNode-id" label="Node id:" ref={idRef} />
            <input type="button" value="Delete!" id="deleteNode-submit" onClick={() => {
                const id = idRef.current?.value;
                if (id) {
                    try {
                        dispatch(createDeleteNodeAction(id));
                        setLastResult({ status: 'OK', message: '' });
                    } catch (error) {
                        setLastResult({ status: 'ERROR', message: error.message });
                    }
                }
            }} />
            <Result message={lastResult.message} status={lastResult.status} />
        </div>
    );
}

function UpdateNodeInput() {
    const initialResult: ResultProps = { status: 'OK', message: '' };
    const [lastResult, setLastResult] = useState(initialResult);

    const idRef = useRef<HTMLInputElement>(null);
    const valueRef = useRef<HTMLInputElement>(null);

    const dispatch = useDispatch();

    return (
        <div>
            <h3>Update node:</h3>
            <TextInput id="updateNode-id" label="Node id:" ref={idRef} />
            <TextInput id="updateNode-value" label="Node value:" ref={valueRef} />
            <input type="button" value="Update!" id="updateNode-submit" onClick={() => {
                const id = idRef.current?.value;
                const value = valueRef.current?.value;
                if (id) {
                    try {
                        dispatch(createUpdateNodeAction(id, (valueByIds: DagIdToValueMap) => {
                            // For this simple example, we sum the given value with all the dependency values
                            let sum = value ? Number(value) : 0;
                            for (const depId in valueByIds) {
                                if (valueByIds.hasOwnProperty(depId)) {
                                    sum += Number(valueByIds[depId]);
                                }
                            }
                            return sum;
                        }));
                        setLastResult({ status: 'OK', message: '' });
                    } catch (error) {
                        setLastResult({ status: 'ERROR', message: error.message });
                    }
                }
            }} />
            <Result message={lastResult.message} status={lastResult.status} />
        </div>
    );
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(({ id, label }, ref) => (
    <div className="textInput">
        <label htmlFor={id}>{label}</label>
        <input type="text" id={id} ref={ref} />
    </div>
));

function Result({ status, message }: ResultProps) {
    return (
        <p style={{ color: status === 'ERROR' ? 'red' : 'black' }}>
            Status - {status} {message}
        </p>
    );
}
