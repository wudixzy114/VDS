import React, {useState, ReactElement, cloneElement, ReactNode, useEffect} from "react";
import {useVDSEngine} from "./context";
import type {Command} from "../core/types";

interface DecoratorProps {
    command: Command;
    children: ReactNode;
    interactionIndicator?: ReactNode;
}

export const Decorator: React.FC<DecoratorProps> = ({
                                                        command,
                                                        children,
                                                        interactionIndicator
                                                    }) => {
    const engine = useVDSEngine();
    const [isPending, setIsPending] = useState(false);
    const handleClick = useCallback(async () => {
        if (isPending) {
            return;
        }
        setIsPending(true);
        try {
            await engine.dispatch(command);
        } finally {
            setIsPending(false);
        }
    }, [engine, command, isPending]);

    const showPendingIndicator = isPending && interactionIndicator;

    return (
        <span style={{position: 'relative', display: 'inline-block'}}>
            {children}

            <div
                style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    cursor: isPending ? 'wait' : 'pointer',
                }}
                onClick={handleClick}
            />

            {showPendingIndicator && (
                <span style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                }}>
                    {interactionIndicator}
                </span>
            )}
        </span>
    );
}