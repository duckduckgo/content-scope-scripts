import { h } from 'preact';
import { Stack } from './Stack';
import { Content } from './Content';
import { useTypedTranslation } from '../../types';

export function Fallback() {
    const { t } = useTypedTranslation();
    return (
        <Content>
            <Stack>
                <h1>{t('somethingWentWrong')}</h1>
            </Stack>
        </Content>
    );
}
