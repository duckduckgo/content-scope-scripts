import { h } from 'preact';
import { useContext, useRef } from 'preact/hooks';
import { GlobalDispatch } from '../../global';

export function SkipLink() {
    const dispatch = useContext(GlobalDispatch);
    const count = useRef(0);

    const handler = () => {
        count.current = count.current + 1;
        if (count.current >= 5) {
            dispatch({ kind: 'dismiss' });
        }
    };

    return <div style="position: fixed; bottom: 0; left: 0; width: 50px; height: 50px" onClick={handler} data-testid="skip" />;
}
