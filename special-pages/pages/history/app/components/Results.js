import { Fragment, h } from 'preact';

/**
 * @param {object} props
 * @param {import("@preact/signals").Signal<import('../../types/history').HistoryQueryResponse>} props.results
 */
export function Results({ results }) {
    return (
        <div>
            <p>Params:</p>
            <pre>
                <code>{JSON.stringify(results.value.info)}</code>
            </pre>
            <br />
            <hr />
            <br />
            <p>Results:</p>
            <ul>
                {results.value.value.map((item) => {
                    return (
                        <li>
                            <pre>
                                <code>{JSON.stringify(item, null, 2)}</code>
                            </pre>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
