import { CustomizerContext } from '../customizer/CustomizerProvider.js';
import { useContext } from 'preact/hooks';
import { useComputed } from '@preact/signals';
import { inferSchemeFrom, themeFromBrowser } from './BackgroundProvider.js';

export function useThemes() {
    const { data } = useContext(CustomizerContext);
    const bg = useComputed(() => {
        return inferSchemeFrom(data.value.background, data.value.theme).bg;
    });
    const browser = useComputed(() => {
        return themeFromBrowser(data.value.theme);
    });
    return { bg, browser };
}
