import { h } from 'preact';
import { noop } from '../../utils.js';
import { CustomizerButton } from './CustomizerMenu.js';
import { EmbeddedVisibilityMenu } from './VisibilityMenu.js';
import { BackgroundSection } from './BackgroundSection.js';
import { ColorSelection } from './ColorSelection.js';
import { GradientSelection } from './GradientSelection.js';
import { useSignal } from '@preact/signals';
import { ImageSelection } from './ImageSelection.js';
import { ArrowIndentCenteredIcon, DuckFoot, SearchIcon, Shield } from '../../components/Icons.js';

/** @type {import('./CustomizerMenu.js').VisibilityRowData[]} */
const ROWS = [
    {
        id: 'omnibar',
        title: 'Search',
        icon: <SearchIcon />,
        toggle: noop('toggle search'),
        visibility: 'visible',
        index: 1,
        enabled: true,
    },
    {
        id: 'omnibar-toggleAi',
        title: 'Duck.ai',
        icon: <ArrowIndentCenteredIcon style={{ color: 'var(--ntp-icons-tertiary)' }} />,
        toggle: noop('toggle Duck.ai'),
        visibility: 'visible',
        index: 1.1,
        enabled: true,
    },
    {
        id: 'favorites',
        title: 'Favorites',
        icon: <Shield />,
        toggle: noop('toggle favorites'),
        visibility: 'hidden',
        index: 0,
        enabled: true,
    },
    {
        id: 'privacyStats',
        title: 'Privacy Stats',
        icon: <DuckFoot />,
        toggle: noop('toggle favorites'),
        visibility: 'visible',
        index: 1,
        enabled: true,
    },
];

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */
export const customizerExamples = {
    'customizer.backgroundSection': {
        factory: () => {
            return (
                <Provider>
                    {({ data, select }) => {
                        return <BackgroundSection data={data} onNav={noop('onNav')} onUpload={noop('onUpload')} select={select} />;
                    }}
                </Provider>
            );
        },
    },
    'customizer.colorSelection': {
        factory: () => {
            return (
                <Provider>
                    {({ data, select }) => {
                        return <ColorSelection data={data} select={select} back={noop('back')} />;
                    }}
                </Provider>
            );
        },
    },
    'customizer.gradientSelection': {
        factory: () => {
            return (
                <Provider>
                    {({ data, select }) => {
                        return <GradientSelection data={data} select={select} back={noop('back')} />;
                    }}
                </Provider>
            );
        },
    },
    'customizer.imageSelection': {
        factory: () => {
            return (
                <Provider>
                    {({ data, select }) => {
                        return (
                            <ImageSelection
                                data={data}
                                select={select}
                                back={noop('back')}
                                onUpload={noop('onUpload')}
                                deleteImage={noop('deleteImage')}
                                customizerContextMenu={noop('customizerContextMenu')}
                            />
                        );
                    }}
                </Provider>
            );
        },
    },
    'customizer-menu': {
        factory: () => (
            <MaxContent>
                <CustomizerButton isOpen={true} kind="menu" />
                <br />
                <div style="width: 206px; border: 1px dotted black">
                    <EmbeddedVisibilityMenu rows={ROWS} />
                </div>
            </MaxContent>
        ),
    },
    'customizer-menu-disabled-item': {
        factory: () => (
            <MaxContent>
                <CustomizerButton isOpen={true} kind="menu" />
                <br />
                <div style="width: 206px; border: 1px dotted black">
                    <EmbeddedVisibilityMenu
                        rows={ROWS.map((row) => {
                            if (row.id === 'omnibar') {
                                /** @type {import('./CustomizerMenu.js').VisibilityRowData}} */
                                return { ...row, visibility: 'hidden' };
                            }
                            if (row.id === 'omnibar-toggleAi') {
                                /** @type {import('./CustomizerMenu.js').VisibilityRowData}} */
                                return { ...row, enabled: false, visibility: 'hidden' };
                            }
                            return row;
                        })}
                    />
                </div>
            </MaxContent>
        ),
    },
};

function MaxContent({ children }) {
    return <div style={{ display: 'grid', gridTemplateColumns: 'max-content' }}>{children}</div>;
}

function Provider({ children }) {
    /** @type {import('../../../types/new-tab.js').CustomizerData} */
    const data = {
        background: { kind: 'hex', value: '#17afa8' },
        theme: 'system',
        userImages: [],
        userColor: null,
    };
    const dataSignal = useSignal(data);
    function select(bg) {
        dataSignal.value = { ...dataSignal.value, background: bg };
    }
    function showPicker() {
        console.log('no-op');
    }
    return children({ data: dataSignal, select, showPicker });
}
