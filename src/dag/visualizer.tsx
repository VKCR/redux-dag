import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../reducers';
import { DagIdToValueMap, DagNodeViewProps, TextInputProps, ResultProps } from './types';
import { createAddNodeAction, createDeleteNodeAction, createUpdateNodeAction } from './actions';

export function DagViewer() {
    const nodeIds = useSelector((state: RootState) => state.dag.nodeIds);

    if (nodeIds.length) {
        return (
            <ul>
                {nodeIds.map(id => <li key={id}><DagNodeView id={id} /></li>)}
            </ul>
        );
    }
    else {
        return (<p>Empty graph</p>);
    }
}

function DagNodeView({ id }: DagNodeViewProps) {
    const node = useSelector((state: RootState) => state.dag.nodeByIds[id]);
    const value = useSelector((state: RootState) => state.dag.valueByIds[id]);

    return (
        <p>
            Id: {node.id}
	    | value: {value}
	    | desc : ({node.desc.join(' ; ')})
	    | deps : ({node.deps.join(' ; ')})
        </p>
    );
}

export function DagControlPanel() {
    return (
        <div>
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
                const updateFunction = deps.length === 0
                    ? (valueByIds: DagIdToValueMap) => value
                    : (valueByIds: DagIdToValueMap) => {
                        // For this simple example, we sum all the dependency values
                        let sum = 0;
                        for (const depId of deps) {
                            sum += Number(valueByIds[depId]);
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
                if (id && value) {
                    try {
                        dispatch(createUpdateNodeAction(id, (values: DagIdToValueMap) => value));
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
    <React.Fragment>
        <label htmlFor={id}>{label}</label>
        <input type="text" id={id} ref={ref} />
    </React.Fragment>
));

function Result({ status, message }: ResultProps) {
    return (
        <p style={{ color: status === 'ERROR' ? 'red' : 'white' }}>
            {status} : {message}
        </p>
    );
}
