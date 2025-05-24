import { useNavContext } from '../Providers/NavProvider.js';
import { useEffect } from 'preact/hooks';
import { useDefaultScreen } from '../Providers/SettingsServiceProvider.js';

/**
 * todo: debounce the url updating?
 */
export function useURLReflection() {
    const nav = useNavContext();
    const defaultScreen = useDefaultScreen();

    useEffect(() => {
        return nav.subscribe((x) => {
            const url = new URL(window.location.href);
            if (x.id) {
                url.pathname = x.id;
                url.searchParams.delete('search');
            } else if (x.term && x.term.trim() !== '') {
                url.pathname = '';
                url.searchParams.set('search', x.term);
            } else {
                url.searchParams.delete('search');
                url.pathname = '';
            }
            window.history.replaceState(null, '', url.toString());
            return undefined;
        });
    }, [nav, defaultScreen]);
}
