import { h, Fragment } from 'preact';
import { noop } from '../../utils.js';
import { CustomizerButton } from './Customizer.js';
import { VisibilityMenu } from './VisibilityMenu.js';

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */

export const customizerExamples = {
    'customizer-menu': {
        factory: () => (
            <Fragment>
                <div>
                    <CustomizerButton isOpen={true} />
                </div>
                <br />
                <MaxContent>
                    <VisibilityMenu
                        rows={[
                            {
                                id: 'favorites',
                                title: 'Favorites',
                                icon: 'star',
                                toggle: noop('toggle favorites'),
                                visibility: 'hidden',
                                index: 0,
                            },
                            {
                                id: 'privacyStats',
                                title: 'Privacy Stats',
                                icon: 'shield',
                                toggle: noop('toggle favorites'),
                                visibility: 'visible',
                                index: 1,
                            },
                        ]}
                    />
                </MaxContent>
            </Fragment>
        ),
    },
};

function MaxContent({ children }) {
    return <div style={{ display: 'grid', gridTemplateColumns: 'max-content' }}>{children}</div>;
}
